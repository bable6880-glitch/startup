import { getKitchenPlanAccess, PlanFeature, PlanId, getMinimumPlanForFeature } from "./plan-access";
import { db } from "@/lib/db";
import { meals } from "@/lib/db/schema";
import { and, eq, isNull, count } from "drizzle-orm";

// ─── Feature Constants ──────────────────────────────────────────────────────

export const FEATURES = {
    FEATURED_BOOST: 'featured_boost',
    VERIFIED_BADGE: 'verified_badge',
    BRANDING_TOOLS: 'branding_tools',
    PROMOTIONS: 'promotions',
    ADVANCED_ANALYTICS: 'advanced_analytics',
    AI_INSIGHTS: 'ai_insights_analytics',
    AI_PRICING: 'ai_pricing',
    AI_SUGGESTIONS: 'ai_suggestions',

    AUTO_WHATSAPP: 'auto_whatsapp',
    DEDICATED_MANAGER: 'dedicated_manager',
    DIGITAL_KHATA: 'digital_khata',
    POTLUCK: 'potluck',
    HIGHLIGHTED_REVIEWS: 'highlighted_reviews',
    ADVANCED_ORDER_TRACKING: 'advanced_order_tracking',
    PREMIUM_MOBILE_UI: 'premium_mobile_ui',
} as const;

// ─── Check Access Result ────────────────────────────────────────────────────

export interface CheckAccessResult {
    allowed: boolean;
    reason?: string;
    upgradeRequired?: PlanId;
    currentUsage?: number;
    limit?: number | null;
}

// ─── Unified Access Check ───────────────────────────────────────────────────

export async function checkAccess(
    kitchenId: string,
    feature: PlanFeature | 'ORDER' | 'MENU_ITEM' | 'POTLUCK_CREATE'
): Promise<CheckAccessResult> {
    const access = await getKitchenPlanAccess(kitchenId);

    switch (feature) {
        case 'ORDER': {
            if (!access.isActive && !access.isFree) {
                return {
                    allowed: false,
                    reason: 'SUBSCRIPTION_EXPIRED',
                    upgradeRequired: 'starter',
                };
            }
            const allowed = access.canPlaceOrder();
            return {
                allowed,
                reason: allowed ? undefined : 'ORDER_LIMIT_EXCEEDED',
                upgradeRequired: allowed ? undefined : getNextPlan(access.planId),
                currentUsage: access.getOrdersUsed(),
                limit: access.getOrderLimit(),
            };
        }

        case 'MENU_ITEM': {
            const currentCount = await getCurrentMenuCount(kitchenId);
            const allowed = access.canAddMenuItem(currentCount);
            return {
                allowed,
                reason: allowed ? undefined : 'MENU_LIMIT_EXCEEDED',
                upgradeRequired: allowed ? undefined : getNextPlan(access.planId),
                currentUsage: currentCount,
                limit: access.getMenuLimit(),
            };
        }

        case 'POTLUCK_CREATE': {
            if (!access.isActive) {
                return {
                    allowed: false,
                    reason: 'SUBSCRIPTION_REQUIRED',
                    upgradeRequired: 'starter',
                };
            }
            const allowed = access.canCreatePotluck();
            return {
                allowed,
                reason: allowed ? undefined : 'POTLUCK_LIMIT_EXCEEDED',
                upgradeRequired: allowed ? undefined : getNextPlan(access.planId),
                currentUsage: undefined,
                limit: access.getPotluckRemaining(),
            };
        }

        default: {
            // Feature check
            if (!access.isActive && !access.isFree) {
                return {
                    allowed: false,
                    reason: 'SUBSCRIPTION_EXPIRED',
                    upgradeRequired: 'starter',
                };
            }
            const allowed = access.hasFeature(feature as PlanFeature);
            return {
                allowed,
                reason: allowed ? undefined : 'PLAN_FEATURE_REQUIRED',
                upgradeRequired: allowed ? undefined : getMinimumPlanForFeature(feature as PlanFeature),
            };
        }
    }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

async function getCurrentMenuCount(kitchenId: string): Promise<number> {
    const result = await db
        .select({ count: count() })
        .from(meals)
        .where(
            and(
                eq(meals.kitchenId, kitchenId),
                isNull(meals.deletedAt)
            )
        );
    return result[0]?.count ?? 0;
}

function getNextPlan(currentPlan: PlanId | null): PlanId {
    const planOrder: PlanId[] = ['starter', 'growth', 'pro', 'elite'];
    if (!currentPlan) return 'starter';
    const idx = planOrder.indexOf(currentPlan);
    return idx < planOrder.length - 1 ? planOrder[idx + 1] : 'elite';
}

// Re-export for convenience
export { getKitchenPlanAccess, type PlanFeature, type PlanId, type PlanAccess } from "./plan-access";
