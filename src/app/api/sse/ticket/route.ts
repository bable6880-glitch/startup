import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { apiSuccess, apiError } from "@/lib/utils/api-response";
import { redis } from "@/lib/redis/index";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
    try {
        const authUser = await getAuthUser(request);
        if (!authUser) return apiError("Unauthorized", "UNAUTHORIZED", 401);

        // Generate one-time ticket
        const ticket = randomUUID();
        const ticketKey = `st:sse:ticket:${ticket}`;

        const body = await request.json().catch(() => ({}));
        const channel = body?.channel as string | undefined;
        const channelId = body?.channelId as string | undefined;

        // Store: userId + role, expires in 30 seconds (enough time to open SSE connection)
        const payload = JSON.stringify({
            userId: authUser.id,
            role: authUser.role,
            firebaseUid: authUser.firebaseUid,
            channel,
            channelId,
        });

        if (redis) {
            await redis.set(ticketKey, payload, { ex: 30 });
        } else {
            // Fallback: if no Redis, use a signed approach or reject
            return apiError("SSE not available (Redis required)", "SERVICE_UNAVAILABLE", 503);
        }

        return apiSuccess({ ticket });
    } catch (error) {
        console.error("Ticket generation error:", error);
        return apiError("Failed to create SSE ticket", "INTERNAL_ERROR", 500);
    }
}
