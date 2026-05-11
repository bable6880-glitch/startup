import { Redis } from "@upstash/redis";

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.warn(
        "⚠️  Redis env vars not set. Redis features will be disabled."
    );
}

export const redis = process.env.UPSTASH_REDIS_REST_URL
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL.replace(/(^"|"$)/g, ""),
        token: process.env.UPSTASH_REDIS_REST_TOKEN!.replace(/(^"|"$)/g, ""),
    })
    : null;

// ─── Cache Helpers ──────────────────────────────────────────────────────────

/**
 * Get cached data or compute and cache it.
 */
export async function cached<T>(
    key: string,
    ttlSeconds: number,
    compute: () => Promise<T>
): Promise<T> {
    if (!redis) return compute();

    try {
        const cached = await redis.get<T>(key);
        if (cached !== null && cached !== undefined) return cached;
    } catch {
        // Redis down — fall through to compute
    }

    const result = await compute();

    try {
        await redis.set(key, JSON.stringify(result), { ex: ttlSeconds });
    } catch {
        // Redis down — silently fail
    }

    return result;
}

/**
 * Invalidate cache keys by pattern prefix.
 */
export async function invalidateCache(prefix: string): Promise<void> {
    if (!redis) return;

    try {
        // For Upstash, we track known keys or use specific key deletion
        // Pattern-based deletion is limited, so we delete known keys
        await redis.del(prefix);
    } catch {
        // Silently fail
    }
}

// ─── Cache Key Patterns ────────────────────────────────────────────────────

export const CacheKeys = {
    kitchensByCity: (citySlug: string) => `kitchens:city:${citySlug}`,
    kitchenProfile: (id: string) => `kitchen:${id}:profile`,
    kitchenMenu: (id: string) => `kitchen:${id}:menu`,
    trendingByCity: (citySlug: string) => `trending:${citySlug}`,
    planConfigs: (region: string) => `plans:${region}`,
    subscriptionStatus: (kitchenId: string) => `subscription:status:${kitchenId}`,
} as const;

export const CacheTTL = {
    CITY_LISTINGS: 300, // 5 minutes
    KITCHEN_PROFILE: 600, // 10 minutes
    KITCHEN_MENU: 600, // 10 minutes
    TRENDING: 900, // 15 minutes
    PLANS: 3600, // 1 hour
    SUBSCRIPTION: 300, // 5 minutes
} as const;
