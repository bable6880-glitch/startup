import { db } from "@/lib/db";
import { subscriptions, planConfigs, meals, kitchens } from "@/lib/db/schema";
import { and, eq, isNull, inArray, count, sql } from "drizzle-orm";
import { cached, invalidateCache, redis } from "@/lib/redis";
import { logger } from "@/lib/utils/logger";

// ─── Types ──────────────────────────────────────────────────────────────────

export type PlanId = 'starter' | 'growth' | 'pro' | 'elite';

export type PlanFeature =
    | 'featured_boost'
    | 'verified_badge'
    | 'branding_tools'
    | 'promotions'
    | 'advanced_analytics'
    | 'ai_insights_analytics'
    | 'ai_pricing'
    | 'ai_suggestions'
    | 'cook_helper_ai'
    | 'auto_whatsapp'
    | 'dedicated_manager'
    | 'digital_khata'
    | 'potluck'
    | 'highlighted_reviews'
    | 'advanced_order_tracking'
    | 'premium_mobile_ui';

type SubscriptionRow = typeof subscriptions.$inferSelect;
type PlanConfigRow = typeof planConfigs.$inferSelect;

// ─── Free Tier Constants ────────────────────────────────────────────────────

const FREE_TIER_MENU_LIMIT = 3;
const FREE_TIER_ORDER_LIMIT = 10;
const PLAN_ACCESS_CACHE_TTL = 60; // seconds

// ─── PlanAccess Interface ───────────────────────────────────────────────────

export interface PlanAccess {
    planId: PlanId | null;
    isActive: boolean;
    isFree: boolean;
    subscription: SubscriptionRow | null;
    planConfig: PlanConfigRow | null;

    // Usage checks
    canAddMenuItem(currentCount: number): boolean;
    canPlaceOrder(): boolean;
    canCreatePotluck(): boolean;
    hasFeature(feature: PlanFeature): boolean;

    // Getters
    getMenuLimit(): number | null;
    getOrderLimit(): number | null;
    getOrdersUsed(): number;
    getOrdersRemaining(): number | null;
    getPotluckRemaining(): number | null;
    getCommissionRate(): number;
    getBoostLevel(): string;
    getAnalyticsLevel(): string;
    getAiSuggestionsLevel(): string;
    getBrandingLevel(): string;

    // Usage percentages for UI
    getOrderUsagePercent(): number | null;
    getMenuUsagePercent(currentCount: number): number | null;
}

// ─── Cached Data Type (plain JSON-serializable, NO methods) ─────────────────

interface CachedPlanData {
    sub: SubscriptionRow | null;
    planConfig: PlanConfigRow | null;
    kitchenPlanId: string | null;
}

// ─── Cache Keys ─────────────────────────────────────────────────────────────

function planAccessCacheKey(kitchenId: string): string {
    // v2 prefix invalidates all stale v1 entries that contain broken serialized objects
    return `plan:access:v2:${kitchenId}`;
}

export async function invalidatePlanAccessCache(kitchenId: string): Promise<void> {
    await invalidateCache(planAccessCacheKey(kitchenId));
    await invalidateCache(`subscription:status:${kitchenId}`);
}

// ─── Main Entry Point ───────────────────────────────────────────────────────

export async function getKitchenPlanAccess(kitchenId: string): Promise<PlanAccess> {
    // Step 1: Cache only plain serializable data (no methods)
    // This prevents Redis JSON.stringify from stripping methods
    const rawData = await cached<CachedPlanData>(
        planAccessCacheKey(kitchenId),
        PLAN_ACCESS_CACHE_TTL,
        async () => {
            const sub = await db.query.subscriptions.findFirst({
                where: and(
                    eq(subscriptions.kitchenId, kitchenId),
                    isNull(subscriptions.cancelledAt),
                    inArray(subscriptions.status, ['ACTIVE', 'TRIALING', 'PAST_DUE']),
                ),
                with: { planConfig: true },
                orderBy: (sub, { desc }) => [desc(sub.createdAt)],
            });

            if (!sub || !sub.planConfig) {
                return { sub: null, planConfig: null, kitchenPlanId: null };
            }

            // Auto-expire if period ended (missed webhook fallback)
            if (new Date() > sub.currentPeriodEnd) {
                await expireSubscription(sub.id, kitchenId);
                return { sub: null, planConfig: null, kitchenPlanId: null };
            }

            return {
                sub: sub,
                planConfig: sub.planConfig,
                kitchenPlanId: sub.planId,
            };
        }
    );

    // Step 2: Build PlanAccess with methods OUTSIDE the cache
    // Methods are rebuilt fresh from cached plain data every time
    // Redis never sees or strips the methods
    if (!rawData.sub || !rawData.planConfig) {
        return buildFreeAccess();
    }

    return buildPlanAccess(rawData.sub, rawData.planConfig);
}

// ─── Build Plan Access (active subscription) ────────────────────────────────

function buildPlanAccess(sub: SubscriptionRow, config: PlanConfigRow): PlanAccess {
    const ordersUsed = sub.ordersUsedThisMonth ?? 0;
    const extraOrders = sub.extraOrdersLimit ?? 0;
    const extraPotluck = sub.extraPotluckUses ?? 0;
    const effectiveOrderLimit = config.monthlyOrderLimit !== null ? config.monthlyOrderLimit + extraOrders : null;

    return {
        planId: sub.planId as PlanId,
        isActive: true,
        isFree: false,
        subscription: sub,
        planConfig: config,

        canAddMenuItem(currentCount: number): boolean {
            if (config.menuItemLimit === null) return true;
            return currentCount < config.menuItemLimit;
        },

        canPlaceOrder(): boolean {
            if (effectiveOrderLimit === null) return true;
            return ordersUsed < effectiveOrderLimit;
        },

        canCreatePotluck(): boolean {
            if (sub.planId === 'elite') return true;
            if (config.potluckUsesPerPeriod === -1) return true;
            const totalRemaining = (sub.potluckUsesRemaining ?? 0) + extraPotluck;
            return totalRemaining > 0;
        },

        hasFeature(feature: PlanFeature): boolean {
            return resolveFeature(config, feature);
        },

        getMenuLimit(): number | null {
            return config.menuItemLimit;
        },

        getOrderLimit(): number | null {
            return effectiveOrderLimit;
        },

        getOrdersUsed(): number {
            return ordersUsed;
        },

        getOrdersRemaining(): number | null {
            if (effectiveOrderLimit === null) return null;
            return Math.max(0, effectiveOrderLimit - ordersUsed);
        },

        getPotluckRemaining(): number | null {
            if (config.potluckUsesPerPeriod === -1) return null;
            return sub.potluckUsesRemaining ?? 0;
        },

        getCommissionRate(): number {
            return Number(config.commissionRate);
        },

        getBoostLevel(): string {
            return config.featuredBoostLevel ?? 'none';
        },

        getAnalyticsLevel(): string {
            return config.analytics ?? 'basic';
        },

        getAiSuggestionsLevel(): string {
            return config.aiSuggestions ?? 'none';
        },

        getBrandingLevel(): string {
            return config.brandingLevel ?? 'none';
        },

        getOrderUsagePercent(): number | null {
            if (effectiveOrderLimit === null) return null;
            return Math.round((ordersUsed / effectiveOrderLimit) * 100);
        },

        getMenuUsagePercent(currentCount: number): number | null {
            if (config.menuItemLimit === null) return null;
            return Math.round((currentCount / config.menuItemLimit) * 100);
        },
    };
}

// ─── Build Free Access (no subscription) ────────────────────────────────────

export function buildFreeAccess(): PlanAccess {
    return {
        planId: null,
        isActive: false,
        isFree: true,
        subscription: null,
        planConfig: null,

        canAddMenuItem(currentCount: number): boolean {
            return currentCount < FREE_TIER_MENU_LIMIT;
        },

        canPlaceOrder(): boolean {
            // Free tier kitchens can still receive orders (limited)
            return true;
        },

        canCreatePotluck(): boolean {
            return false;
        },

        hasFeature(): boolean {
            return false;
        },

        getMenuLimit(): number {
            return FREE_TIER_MENU_LIMIT;
        },

        getOrderLimit(): number {
            return FREE_TIER_ORDER_LIMIT;
        },

        getOrdersUsed(): number {
            return 0;
        },

        getOrdersRemaining(): number {
            return FREE_TIER_ORDER_LIMIT;
        },

        getPotluckRemaining(): number {
            return 0;
        },

        getCommissionRate(): number {
            return 0;
        },

        getBoostLevel(): string {
            return 'none';
        },

        getAnalyticsLevel(): string {
            return 'basic';
        },

        getAiSuggestionsLevel(): string {
            return 'none';
        },

        getBrandingLevel(): string {
            return 'none';
        },

        getOrderUsagePercent(): null {
            return null;
        },

        getMenuUsagePercent(currentCount: number): number {
            return Math.round((currentCount / FREE_TIER_MENU_LIMIT) * 100);
        },
    };
}

// ─── Feature Resolution ─────────────────────────────────────────────────────

function resolveFeature(config: PlanConfigRow, feature: PlanFeature): boolean {
    // Top-tier 'elite' plan always has access to everything
    if (config.planId === 'elite') return true;

    switch (feature) {
        case 'featured_boost':
            return !!config.featuredBoostLevel && config.featuredBoostLevel !== 'none';
        case 'verified_badge':
            return !!config.brandingLevel && config.brandingLevel !== 'none';
        case 'branding_tools':
            return config.brandingTools ?? false;
        case 'promotions':
            return !!config.promotionsLevel && config.promotionsLevel !== 'none';
        case 'advanced_analytics':
            return config.advancedAnalytics ?? false;
        case 'ai_insights_analytics':
            return config.analytics === 'ai_insights';
        case 'ai_pricing':
            return config.aiPricing ?? false;
        case 'ai_suggestions':
            return !!config.aiSuggestions && config.aiSuggestions !== 'none';
        case 'cook_helper_ai':
            return config.cookHelperAi ?? false;
        case 'auto_whatsapp':
            return config.autoWhatsApp ?? false;
        case 'dedicated_manager':
            return config.dedicatedManager ?? false;
        case 'digital_khata':
            return config.digitalKhata ?? false;
        case 'potluck':
            return config.potluckUsesPerPeriod !== 0;
        case 'highlighted_reviews':
            return config.reviewsHighlighted ?? false;
        case 'advanced_order_tracking':
            return config.orderTrackingLevel === 'advanced';
        case 'premium_mobile_ui':
            return config.mobileUiLevel === 'premium_ui';
        default:
            return false;
    }
}

// ─── Subscription Expiry ────────────────────────────────────────────────────

async function expireSubscription(subscriptionId: string, kitchenId: string) {
    logger.info("Auto-expiring subscription (fallback)", { subscriptionId, kitchenId });

    // 1. Mark subscription expired
    await db.update(subscriptions)
        .set({ status: 'EXPIRED', updatedAt: new Date() })
        .where(eq(subscriptions.id, subscriptionId));

    // 1b. Clear planId from kitchen (prevent stale badge) and lock kitchen
    await db.update(kitchens)
        .set({
            planId: null,
            isLocked: true,
            lockReason: 'SUBSCRIPTION_EXPIRED',
            lockedAt: new Date(),
            updatedAt: new Date(),
        })
        .where(eq(kitchens.id, kitchenId));

    // 2. Handle menu item overflow — hide excess meals beyond free tier limit
    const mealCountResult = await db
        .select({ count: count() })
        .from(meals)
        .where(
            and(
                eq(meals.kitchenId, kitchenId),
                eq(meals.isAvailable, true),
                isNull(meals.deletedAt)
            )
        );

    const currentCount = mealCountResult[0]?.count ?? 0;
    if (currentCount > FREE_TIER_MENU_LIMIT) {
        const excess = currentCount - FREE_TIER_MENU_LIMIT;
        // Hide most recently created excess meals
        await db.execute(sql`
            UPDATE meals
            SET is_available = false,
                availability_status = 'NOT_TODAY',
                updated_at = NOW()
            WHERE id IN (
                SELECT id FROM meals
                WHERE kitchen_id = ${kitchenId}
                  AND is_available = true
                  AND deleted_at IS NULL
                ORDER BY created_at DESC
                LIMIT ${excess}
            )
        `);
        logger.info("Hidden excess meals on subscription expiry", {
            kitchenId, excess, previousCount: currentCount
        });
    }

    // 3. Invalidate caches
    await invalidatePlanAccessCache(kitchenId);

    // 4. Notify cook
    try {
        const subRecord = await db.query.subscriptions.findFirst({
            where: eq(subscriptions.id, subscriptionId),
            columns: { userId: true }
        });
        if (subRecord?.userId) {
            const { notifySystemMessage } = await import("@/services/notification.service");
            await notifySystemMessage(subRecord.userId, "Your premium subscription has expired. Excess menu items have been hidden.");
        }
    } catch (e) {
        logger.error("Failed to notify cook of subscription expiry", { error: e });
    }
}

// ─── Minimum Plan for Feature (used in error messages) ──────────────────────

export function getMinimumPlanForFeature(feature: PlanFeature): PlanId {
    const featurePlanMap: Record<PlanFeature, PlanId> = {
        'featured_boost': 'starter',
        'verified_badge': 'growth',
        'branding_tools': 'growth',
        'promotions': 'growth',
        'advanced_analytics': 'pro',
        'ai_insights_analytics': 'elite',
        'ai_pricing': 'elite',
        'ai_suggestions': 'starter',
        'cook_helper_ai': 'growth',
        'auto_whatsapp': 'elite',
        'dedicated_manager': 'elite',
        'digital_khata': 'pro',
        'potluck': 'starter',
        'highlighted_reviews': 'elite',
        'advanced_order_tracking': 'elite',
        'premium_mobile_ui': 'elite',
    };
    return featurePlanMap[feature] ?? 'elite';
}
