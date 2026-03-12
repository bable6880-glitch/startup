'use client';

import { useEffect, useLayoutEffect, useRef, useCallback, useState } from "react";
import { useAuth } from "@/lib/firebase/auth-context";
import type { SSEPayload } from "@/lib/redis/pubsub";

interface UseCustomerSSEOptions {
    customerId: string | null;
    onStatusChange?: (payload: Record<string, unknown>) => void;
}

export function useCustomerSSE({ customerId, onStatusChange }: UseCustomerSSEOptions) {
    const { getIdToken } = useAuth();
    const [connected, setConnected] = useState(false);
    const [status, setStatus] = useState<"connecting" | "connected" | "disconnected">("disconnected");

    const eventSourceRef = useRef<EventSource | null>(null);
    const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const reconnectAttemptsRef = useRef(0);
    const connectRef = useRef<() => void>(() => { });

    // Stable ref for callback — no re-connect when handler changes
    const onStatusChangeRef = useRef(onStatusChange);
    useLayoutEffect(() => { onStatusChangeRef.current = onStatusChange; }, [onStatusChange]);

    const connect = useCallback(async () => {
        if (!customerId) return;
        if (eventSourceRef.current) eventSourceRef.current.close();

        try {
            const token = await getIdToken();
            if (!token) return;

            setStatus("connecting");

            // Step 1: Get one-time ticket
            const ticketRes = await fetch("/api/sse/ticket", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            const { data: { ticket } } = await ticketRes.json();

            // Step 2: Open SSE with ticket
            const es = new EventSource(`/api/sse/customer/${customerId}?ticket=${ticket}`, { withCredentials: true });
            eventSourceRef.current = es;

            es.onopen = () => {
                setConnected(true);
                setStatus("connected");
                reconnectAttemptsRef.current = 0;
            };

            es.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data) as SSEPayload;

                    if (data.type === "HEARTBEAT" || data.type === "CONNECTED") return;

                    if (data.type === "ORDER_STATUS_CHANGED") {
                        onStatusChangeRef.current?.(data.payload);
                    }
                } catch (err) {
                    console.error("[useCustomerSSE] Parse error:", err);
                }
            };

            es.onerror = () => {
                setConnected(false);
                setStatus("disconnected");
                es.close();

                const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
                reconnectAttemptsRef.current++;
                reconnectTimeoutRef.current = setTimeout(() => connectRef.current(), delay);
            };
        } catch (err) {
            console.error("[useCustomerSSE] Connection error:", err);
            setStatus("disconnected");
            reconnectTimeoutRef.current = setTimeout(() => connectRef.current(), 5000);
        }
    }, [customerId, getIdToken]);

    useLayoutEffect(() => {
        connectRef.current = connect;
    }, [connect]);

    useEffect(() => {
        // ✅ Deferred via setTimeout(0) — avoids synchronous setState lint warning
        const timer = setTimeout(() => connectRef.current(), 0);
        return () => {
            clearTimeout(timer);
            eventSourceRef.current?.close();
            clearTimeout(reconnectTimeoutRef.current);
        };
    }, [connect]);

    return { connected, status };
}