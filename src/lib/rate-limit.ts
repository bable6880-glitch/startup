import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Only initialize if Upstash env vars are present
const hasRedis = !!(
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
);

const redis = hasRedis ? Redis.fromEnv() : null;

// Route-specific limiters (sliding window, distributed)
const createLimiter = (requests: number, window: string) => {
    if (!redis) return null;
    return new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(requests, window as `${number} m`),
        analytics: false,
        prefix: "st:rl", // Smart Tiffin rate limit namespace
    });
};

export const rateLimiters = {
    auth: createLimiter(10, "1 m"),
    orders: createLimiter(20, "1 m"),
    reviews: createLimiter(30, "1 m"),
    admin: createLimiter(30, "1 m"),
    premium: createLimiter(20, "1 m"),
    search: createLimiter(60, "1 m"),
    kitchens: createLimiter(60, "1 m"),
    upload: createLimiter(10, "1 m"),
    default: createLimiter(60, "1 m"),
};

export type RateLimiterKey = keyof typeof rateLimiters;

// Returns the correct limiter key for a given pathname
export function getLimiterKey(pathname: string): RateLimiterKey {
    if (pathname.startsWith("/api/auth")) return "auth";
    if (pathname.startsWith("/api/orders")) return "orders";
    if (pathname.startsWith("/api/reviews")) return "reviews";
    if (pathname.startsWith("/api/admin")) return "admin";
    if (pathname.startsWith("/api/premium")) return "premium";
    if (pathname.startsWith("/api/seller/subscription")) return "premium";
    if (pathname.startsWith("/api/search")) return "search";
    if (pathname.startsWith("/api/kitchens")) return "kitchens";
    if (pathname.startsWith("/api/upload")) return "upload";
    return "default";
}

// Get client IP from request (works behind Amplify/CloudFront)
export function getClientIp(request: Request): string {
    const forwarded = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    if (forwarded) return forwarded.split(",")[0].trim();
    if (realIp) return realIp.trim();
    return "unknown";
}
