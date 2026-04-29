import { rateLimiters } from "@/lib/rate-limit";
import { logger } from "@/lib/utils/logger";

export async function proxyRequest(url: string, ip: string, options: RequestInit = {}) {
    try {
        const limiter = rateLimiters.default;
        if (limiter) {
            const { success } = await limiter.limit(`proxy_${ip}`);
            if (!success) {
                logger.warn("Proxy rate limit exceeded", { ip });
                throw new Error("Rate limit exceeded");
            }
        }
    } catch (error: any) {
        if (error.message === "Rate limit exceeded") throw error;
        logger.error("Rate limiter check failed, allowing request", { error });
    }

    // Pass the request along
    return fetch(url, options);
}
