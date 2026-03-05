import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/firebase/auth-context";

export interface RealtimeEvent {
    type: "NEW_ORDER" | "ORDER_STATUS" | "PING";
    timestamp: string;
    payload: Record<string, unknown>;
}

export function useCustomerSSE(customerId: string | null, onStatusChange?: (orderId: string, status: string) => void) {
    const { getIdToken } = useAuth();
    const [status, setStatus] = useState<"connecting" | "connected" | "disconnected">("disconnected");

    const connect = useCallback(async () => {
        if (!customerId) return null;

        try {
            const token = await getIdToken();
            if (!token) return null;

            setStatus("connecting");

            const es = new EventSource(`/api/sse/customer/${customerId}?token=${token}`);

            es.onopen = () => {
                setStatus("connected");
            };

            es.onmessage = (event) => {
                // Ignore heartbeats
                if (event.data.includes("heartbeat")) return;

                try {
                    const realtimeEvent = JSON.parse(event.data) as RealtimeEvent;
                    if (realtimeEvent.type === "ORDER_STATUS" && onStatusChange) {
                        const { orderId, status } = realtimeEvent.payload;
                        if (typeof orderId === "string" && typeof status === "string") {
                            onStatusChange(orderId, status);
                        }
                    }
                } catch (err) {
                    console.error("[useCustomerSSE] Parse error:", err);
                }
            };

            return es;
        } catch (err) {
            console.error("[useCustomerSSE] Connection error:", err);
            setStatus("disconnected");
            return null;
        }
    }, [customerId, getIdToken, onStatusChange]);

    useEffect(() => {
        let es: EventSource | null = null;
        let reconnectTimeout: NodeJS.Timeout | null = null;
        let attempts = 0;
        let isActive = true;

        const startConnection = async () => {
            if (!isActive) return;

            es = await connect();

            if (es) {
                es.onerror = () => {
                    if (!isActive) return;
                    setStatus("disconnected");
                    es?.close();

                    const delay = Math.min(1000 * Math.pow(2, attempts), 30000);
                    attempts++;
                    reconnectTimeout = setTimeout(startConnection, delay);
                };
            } else if (isActive) {
                reconnectTimeout = setTimeout(startConnection, 5000);
            }
        };

        startConnection();

        return () => {
            isActive = false;
            es?.close();
            if (reconnectTimeout) clearTimeout(reconnectTimeout);
        };
    }, [connect]);

    return { status };
}
