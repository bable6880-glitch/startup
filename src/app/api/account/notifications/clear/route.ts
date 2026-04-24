import { NextRequest } from "next/server";
import { apiSuccess, apiUnauthorized } from "@/lib/utils/api-response";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { clearAllNotifications } from "@/services/notification.service";
import { redis } from "@/lib/redis";

export async function POST(request: NextRequest) {
    const user = await getAuthUser(request);
    if (!user) return apiUnauthorized();

    // Rate limiting (10 requests per minute per user)
    if (redis) {
        const rateLimitKey = `rate-limit:notifications-clear:${user.id}`;
        const currentCount = await redis.incr(rateLimitKey);
        if (currentCount === 1) {
            await redis.expire(rateLimitKey, 60);
        }
        if (currentCount > 10) {
            return new Response(JSON.stringify({ error: "Too many requests" }), {
                status: 429,
                headers: { "Content-Type": "application/json" }
            });
        }
    }

    await clearAllNotifications(user.id);

    return apiSuccess({
        message: "All notifications cleared",
    });
}
