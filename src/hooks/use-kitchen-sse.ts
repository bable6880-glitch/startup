'use client';

import { useEffect, useLayoutEffect, useRef, useCallback, useState } from "react";
import { useAuth } from "@/lib/firebase/auth-context";
import type { SSEPayload } from "@/lib/redis/pubsub";

interface UseKitchenSSEOptions {
    kitchenId: string | null;
    onNewOrder?: (payload: Record<string, unknown>) => void;
    onOrderStatusChanged?: (payload: Record<string, unknown>) => void;
    onSubscriptionChanged?: (payload: Record<string, unknown>) => void;
    onPotluckUpdate?: (payload: Record<string, unknown>) => void;
}

export function useKitchenSSE({ kitchenId, onNewOrder, onOrderStatusChanged, onSubscriptionChanged, onPotluckUpdate }: UseKitchenSSEOptions) {
    const { getIdToken } = useAuth();
    const [connected, setConnected] = useState(false);
    const [status, setStatus] = useState<"connecting" | "connected" | "disconnected">("disconnected");
    const [lastEvent, setLastEvent] = useState<SSEPayload | null>(null);

    const eventSourceRef = useRef<EventSource | null>(null);
    const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const reconnectAttemptsRef = useRef(0);
    const connectRef = useRef<() => void>(() => { });

    const onNewOrderRef = useRef(onNewOrder);
    const onOrderStatusChangedRef = useRef(onOrderStatusChanged);
    const onSubChangedRef = useRef(onSubscriptionChanged);
    const onPotluckUpdateRef = useRef(onPotluckUpdate);
    useLayoutEffect(() => { onNewOrderRef.current = onNewOrder; }, [onNewOrder]);
    useLayoutEffect(() => { onOrderStatusChangedRef.current = onOrderStatusChanged; }, [onOrderStatusChanged]);
    useLayoutEffect(() => { onSubChangedRef.current = onSubscriptionChanged; }, [onSubscriptionChanged]);
    useLayoutEffect(() => { onPotluckUpdateRef.current = onPotluckUpdate; }, [onPotluckUpdate]);

    const connect = useCallback(async () => {
        if (!kitchenId) return;
        if (eventSourceRef.current) eventSourceRef.current.close();

        try {
            const token = await getIdToken();
            if (!token) return;

            setStatus("connecting");

            // Step 1: Get one-time ticket
            const ticketRes = await fetch("/api/sse/ticket", {
                method: "POST",
                headers: { 
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ channel: "kitchen", channelId: kitchenId })
            });
            const { data: { ticket } } = await ticketRes.json();

            // Step 2: Open SSE with ticket
            const es = new EventSource(`/api/sse/kitchen/${kitchenId}?ticket=${ticket}`, { withCredentials: true });
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

                    setLastEvent(data);

                    switch (data.type) {
                        case "NEW_ORDER":
                            onNewOrderRef.current?.(data.payload);
                            if (typeof Notification !== "undefined" && Notification.permission === "granted") {
                                new Notification("🍽️ New Order!", {
                                    body: `From ${data.payload.customerName ?? "Customer"} — PKR ${data.payload.totalAmount}`,
                                    icon: "/favicon.ico",
                                });
                            }
                            break;
                        case "ORDER_STATUS_CHANGED":
                            onOrderStatusChangedRef.current?.(data.payload);
                            break;
                        case "SUBSCRIPTION_CHANGED":
                            onSubChangedRef.current?.(data.payload);
                            break;
                        case "POTLUCK_UPDATE":
                            onPotluckUpdateRef.current?.(data.payload);
                            break;
                    }
                } catch (err) {
                    console.error("[useKitchenSSE] Parse error:", err);
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
            console.error("[useKitchenSSE] Connection error:", err);
            setStatus("disconnected");
            reconnectTimeoutRef.current = setTimeout(() => connectRef.current(), 5000);
        }
    }, [kitchenId, getIdToken]);

    useLayoutEffect(() => {
        connectRef.current = connect;
    }, [connect]);

    useEffect(() => {
        // ✅ Defer via setTimeout(0) — breaks the synchronous setState chain
        // the linter traces through connect(), eliminating the cascading render warning
        const timer = setTimeout(() => connectRef.current(), 0);
        return () => {
            clearTimeout(timer);
            eventSourceRef.current?.close();
            clearTimeout(reconnectTimeoutRef.current);
        };
    }, [connect]);

    return { connected, status, lastEvent };
}