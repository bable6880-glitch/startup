import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/firebase/auth-context";

export interface RealtimeEvent {
    type: "NEW_ORDER" | "ORDER_STATUS" | "PING";
    timestamp: string;
    payload: any;
}

export function useKitchenSSE(kitchenId: string | null, onNewOrder?: (order: Record<string, unknown>) => void) {
    const { getIdToken } = useAuth();
    const [status, setStatus] = useState<"connecting" | "connected" | "disconnected">("disconnected");

    const connect = useCallback(async () => {
        if (!kitchenId) return null;

        try {
            const token = await getIdToken();
            if (!token) return null;

            setStatus("connecting");

            const es = new EventSource(`/api/sse/kitchen/${kitchenId}?token=${token}`);

            es.onopen = () => {
                setStatus("connected");
            };

            es.onmessage = (event) => {
                // Ignore heartbeats
                if (event.data.includes("heartbeat")) return;

                try {
                    const realtimeEvent = JSON.parse(event.data) as RealtimeEvent;
                    if (realtimeEvent.type === "NEW_ORDER" && onNewOrder) {
                        onNewOrder(realtimeEvent.payload);
                    }
                } catch (err) {
                    console.error("[useKitchenSSE] Parse error:", err);
                }
            };

            return es;
        } catch (err) {
            console.error("[useKitchenSSE] Connection error:", err);
            setStatus("disconnected");
            return null;
        }
    }, [kitchenId, getIdToken, onNewOrder]);

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
                // If connect failed (e.g. no token), retry later
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
