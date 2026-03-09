import { redis } from "./index";
import { logger } from "@/lib/utils/logger";

// ─── Channel Name Helpers ────────────────────────────────────────────────────

export const CHANNELS = {
    kitchenOrders: (kitchenId: string) => `st:orders:kitchen:${kitchenId}`,
    customerOrders: (customerId: string) => `st:orders:customer:${customerId}`,
} as const;

// ─── Types ───────────────────────────────────────────────────────────────────

export type SSEEventType =
    | "NEW_ORDER"
    | "ORDER_STATUS_CHANGED"
    | "NEW_REVIEW"
    | "SUBSCRIPTION_CHANGED"
    | "CONNECTED"
    | "HEARTBEAT";

export interface SSEPayload {
    type: SSEEventType;
    payload: Record<string, unknown>;
    timestamp: number;
}

// Keep legacy type alias for any existing code using RealtimeEvent
export type RealtimeEvent = SSEPayload;

// ─── Constants ───────────────────────────────────────────────────────────────

const EVENT_LIST_LIMIT = 50;
const CHANNEL_TTL = 3600; // 1 hour

// ─── Publish ─────────────────────────────────────────────────────────────────

/**
 * Publish an event to a Redis-backed channel (list).
 * Matches Phase 3 API: publishEvent(channel, { type, payload })
 */
export async function publishEvent(
    channel: string,
    event: Omit<SSEPayload, "timestamp">
): Promise<void> {
    if (!redis) return;

    try {
        const fullEvent: SSEPayload = {
            ...event,
            timestamp: Date.now(),
        };

        const key = `${channel}:events`;

        await redis
            .pipeline()
            .lpush(key, JSON.stringify(fullEvent))
            .ltrim(key, 0, EVENT_LIST_LIMIT - 1) // Keep last 50 events
            .expire(key, CHANNEL_TTL)             // Auto-expire after 1 hour
            .exec();

        logger.debug("Real-time event published", { channel, type: event.type });
    } catch (error) {
        logger.error("Failed to publish real-time event", {
            channel,
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
}

// ─── Read ────────────────────────────────────────────────────────────────────

/**
 * Read events newer than a given timestamp from a channel.
 * Matches Phase 3 API: readEvents(channel, since)
 */
export async function readEvents(
    channel: string,
    since: number
): Promise<SSEPayload[]> {
    if (!redis) return [];

    try {
        const key = `${channel}:events`;
        const raw = await redis.lrange<string>(key, 0, EVENT_LIST_LIMIT - 1);

        return raw
            .map((item) => {
                try {
                    return JSON.parse(item) as SSEPayload;
                } catch {
                    return null;
                }
            })
            .filter((e): e is SSEPayload => e !== null && e.timestamp > since)
            .sort((a, b) => a.timestamp - b.timestamp);
    } catch (error) {
        logger.error("Failed to read real-time events", {
            channel,
            error: error instanceof Error ? error.message : "Unknown error",
        });
        return [];
    }
}

// ─── Legacy Helpers (kept for backward compatibility) ────────────────────────

/**
 * @deprecated Use publishEvent() instead
 */
export async function collectAndPublishEvent(
    channel: string,
    event: Omit<RealtimeEvent, "timestamp">
): Promise<void> {
    return publishEvent(channel, event as Omit<SSEPayload, "timestamp">);
}

/**
 * @deprecated Use readEvents() instead
 */
export async function getLatestEvents(channel: string): Promise<RealtimeEvent[]> {
    return readEvents(channel, 0);
}

/**
 * @deprecated Use CHANNELS instead
 */
export const RealtimeChannels = {
    kitchen: (kitchenId: string) => `st:events:kitchen:${kitchenId}`,
    customer: (customerId: string) => `st:events:customer:${customerId}`,
};