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
    const raw = await redis.get<string>(ticketKey);
    if (!raw) return null;

    await redis.del(ticketKey); // Consume immediately — single use only

    try {
        return JSON.parse(raw) as SSETicketPayload;
    } catch {
        return null;
    }
}
