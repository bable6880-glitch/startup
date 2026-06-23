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
    search: createLimiter(60, "1 m"), // general search
    suggestions: createLimiter(30, "1 m"),
    kitchens: createLimiter(60, "1 m"),
    upload: createLimiter(10, "1 m"),
    // ── Monetization engine rate limits ──
    sellerPotluck: createLimiter(100, "1 m"),       // 100/min/user (Dashboard reads/updates)
    potluckReserve: createLimiter(5, "1 m"),         // 5/min/user
    aiPricing: createLimiter(20, "60 m"),             // 20/hour/user

    subscriptionCheckout: createLimiter(30, "60 m"),  // 30/hour/user
    khata: createLimiter(60, "1 m"),                  // 60/min/user
    // ── Admin Portal ──
    adminPortalAuth: createLimiter(5, "15 m"),        // 5/15min/IP
    adminPortalApi: createLimiter(100, "1 m"),        // 100/min/IP
    default: createLimiter(60, "1 m"),
};

export type RateLimiterKey = keyof typeof rateLimiters;

// Returns the correct limiter key for a given pathname
export function getLimiterKey(pathname: string): RateLimiterKey {
    if (pathname.startsWith("/api/admin-portal/auth")) return "adminPortalAuth";
    if (pathname.startsWith("/api/admin-portal")) return "adminPortalApi";
    if (pathname.startsWith("/api/auth")) return "auth";
    if (pathname.startsWith("/api/orders")) return "orders";
    if (pathname.startsWith("/api/reviews")) return "reviews";
    if (pathname.startsWith("/api/admin")) return "admin";
    // ── Monetization engine routes (more specific first) ──
    if (pathname.startsWith("/api/seller/subscription/checkout")) return "subscriptionCheckout";
    if (pathname.startsWith("/api/seller/subscription")) return "premium";
    if (pathname.startsWith("/api/seller/ai/pricing")) return "aiPricing";

    if (pathname.startsWith("/api/seller/potluck")) return "sellerPotluck";
    if (pathname.startsWith("/api/seller/khata")) return "khata";
    if (pathname.startsWith("/api/potluck") && pathname.includes("/reserve")) return "potluckReserve";
    if (pathname.startsWith("/api/premium")) return "premium";
    if (pathname.startsWith("/api/search/suggestions")) return "suggestions";
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

// ─── Admin Portal Rate Limiters (standalone exports) ────────────────────────

export const adminPortalAuth = createLimiter(5, "15 m");    // 5 attempts per 15 min
export const adminOtpVerify  = createLimiter(3, "10 m");    // 3 attempts per 10 min

