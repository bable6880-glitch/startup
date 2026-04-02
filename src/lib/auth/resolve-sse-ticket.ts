import { redis } from "@/lib/redis/index";

export interface SSETicketPayload {
    userId: string;
    role: string;
    firebaseUid: string;
    channel?: string;
    channelId?: string;
}

export async function resolveSseTicket(ticket: string): Promise<SSETicketPayload | null> {
    if (!redis || !ticket) return null;

    const ticketKey = `st:sse:ticket:${ticket}`;

    // Atomic get + delete (one-time use)
    const raw = await redis.get(ticketKey);
    if (!raw) return null;

    await redis.del(ticketKey); // Consume immediately — single use only

    try {
        // Upstash Redis auto-deserializes JSON, so `raw` may already be an object.
        // Handle both cases: already-parsed object OR raw JSON string.
        if (typeof raw === "object" && raw !== null) {
            return raw as SSETicketPayload;
        }
        return JSON.parse(raw as string) as SSETicketPayload;
    } catch {
        return null;
    }
}

