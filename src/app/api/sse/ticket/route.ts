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

        // Store: userId + role, expires in 30 seconds (enough time to open SSE connection)
        const payload = JSON.stringify({
            userId: authUser.id,
            role: authUser.role,
            firebaseUid: authUser.firebaseUid,
        });

        if (redis) {
            await redis.set(ticketKey, payload, { ex: 30 });
        } else {
            // Fallback: if no Redis, use a signed approach or reject
            return apiError("SSE not available (Redis required)", "SERVICE_UNAVAILABLE", 503);
        }

        return apiSuccess({ ticket });
    } catch (error) {
        return apiError("Failed to create SSE ticket", "INTERNAL_ERROR", 500);
    }
}
