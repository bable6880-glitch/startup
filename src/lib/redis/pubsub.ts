import { redis } from "./index";
import { logger } from "@/lib/utils/logger";

/**
 * Standard event structure for SSE
 */
export interface RealtimeEvent {
    type: "NEW_ORDER" | "ORDER_STATUS" | "PING";
    timestamp: string;
    payload: Record<string, unknown>;
}

const EVENT_LIST_LIMIT = 50;
const CHANNEL_TTL = 3600; // 1 hour

/**
 * Publish an event to a Redis-backed channel (list)
 */
export async function collectAndPublishEvent(channel: string, event: Omit<RealtimeEvent, "timestamp">) {
    if (!redis) return;

    try {
        const fullEvent: RealtimeEvent = {
            ...event,
            timestamp: new Date().toISOString(),
        };

        const eventStr = JSON.stringify(fullEvent);

        // RPUSH to the end of the list
        // LTRIM to keep only the last N events
        // EXPIRE to ensure the channel cleans up if unused
        await redis
            .pipeline()
            .rpush(channel, eventStr)
            .ltrim(channel, -EVENT_LIST_LIMIT, -1)
            .expire(channel, CHANNEL_TTL)
            .exec();

        logger.debug("Real-time event published", { channel, type: event.type });
    } catch (error) {
        logger.error("Failed to publish real-time event", {
            channel,
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
}

/**
 * Read the latest events from a channel
 */
export async function getLatestEvents(channel: string): Promise<RealtimeEvent[]> {
    if (!redis) return [];

    try {
        const rawEvents = await redis.lrange<string>(channel, 0, -1);
        return rawEvents.map((e) => JSON.parse(e));
    } catch (error) {
        logger.error("Failed to read real-time events", {
            channel,
            error: error instanceof Error ? error.message : "Unknown error",
        });
        return [];
    }
}

/**
 * Convenience helpers for specific channels
 */
export const RealtimeChannels = {
    kitchen: (kitchenId: string) => `st:events:kitchen:${kitchenId}`,
    customer: (customerId: string) => `st:events:customer:${customerId}`,
};
