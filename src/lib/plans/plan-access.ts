import { db } from "@/lib/db";
import { subscriptions, planConfigs } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { logger } from "@/lib/utils/logger";

export type PlanId = 'starter' | 'growth' | 'pro' | 'elite';

export type PlanFeature =
    | 'featured_boost'
    | 'priority_support'
    | 'branding_tools'
    | 'promotions'
    | 'advanced_analytics'
    | 'ai_pricing'
    | 'auto_whatsapp'
    | 'dedicated_manager'
    | 'chef_assistant'
    | 'digital_khata'
    | 'potluck';

export interface PlanAccess {
    planId: PlanId;
    planConfig: typeof planConfigs.$inferSelect;
    subscription: typeof subscriptions.$inferSelect | null;
    canAddMenuItem: (currentCount: number) => boolean;
    canPlaceOrder: (monthlyCount: number) => boolean;
    canCreatePotluck: () => boolean;
    hasFeature: (feature: PlanFeature) => boolean;
    getRemainingOrders: () => number | null;
    getRemainingPotlucks: () => number | null;
    getCommissionRate: () => number;
    getBoostLevel: () => string;
    isActive: () => boolean;
}

export async function getKitchenPlanAccess(kitchenId: string): Promise<PlanAccess> {
    const sub = await db.query.subscriptions.findFirst({
        where: and(
            eq(subscriptions.kitchenId, kitchenId),
            eq(subscriptions.status, 'ACTIVE')
        ),
        with: { planConfig: true }
    });

    if (!sub || !sub.planConfig) {
        return buildFreeAccess(kitchenId);
    }

    if (new Date() > sub.currentPeriodEnd) {
        // Auto-expire if missed webhook (fallback)
        await expireSubscription(sub.id);
        return buildFreeAccess(kitchenId);
    }

    return buildPlanAccess(sub, sub.planConfig);
}

function buildPlanAccess(
    sub: typeof subscriptions.$inferSelect,
    config: typeof planConfigs.$inferSelect
): PlanAccess {
    return {
        planId: sub.planId as PlanId,
        planConfig: config,
        subscription: sub,

        canAddMenuItem: (currentCount: number) => {
            if (config.menuItemLimit === null) return true;
            return currentCount < config.menuItemLimit;
        },

        canPlaceOrder: (monthlyCount: number) => {
            if (config.monthlyOrderLimit === null) return true;
            return monthlyCount < config.monthlyOrderLimit;
        },

        canCreatePotluck: () => {
            if (config.potluckUsesPerPeriod === -1) return true;
            return sub.potluckUsesRemaining > 0;
        },

        hasFeature: (feature: PlanFeature) => {
            const featureMap: Record<PlanFeature, boolean> = {
                featured_boost: config.featuredBoostLevel !== 'none' && config.featuredBoostLevel !== null,
                priority_support: config.prioritySupport ?? false,
                branding_tools: config.brandingTools ?? false,
                promotions: config.promotionsLevel !== 'none' && config.promotionsLevel !== null,
                advanced_analytics: config.advancedAnalytics ?? false,
                ai_pricing: config.aiPricing ?? false,
                auto_whatsapp: config.autoWhatsApp ?? false,
                dedicated_manager: config.dedicatedManager ?? false,
                chef_assistant: config.chefAssistant ?? false,
                digital_khata: config.digitalKhata ?? false,
                potluck: config.potluckUsesPerPeriod !== 0,
            };
            return featureMap[feature] ?? false;
        },

        getRemainingOrders: () => {
            if (config.monthlyOrderLimit === null) return null;
            return Math.max(0, config.monthlyOrderLimit - (sub.ordersUsedThisMonth ?? 0));
        },

        getRemainingPotlucks: () => {
            if (config.potluckUsesPerPeriod === -1) return null;
            return sub.potluckUsesRemaining;
        },

        getCommissionRate: () => Number(config.commissionRate),

        getBoostLevel: () => config.featuredBoostLevel ?? 'none',

        isActive: () => sub.status === 'ACTIVE',
    };
}

// Fallback logic for FREE tier (or missing subscription)
async function buildFreeAccess(kitchenId: string): Promise<PlanAccess> {
    let freeConfig = await db.query.planConfigs.findFirst({
        where: eq(planConfigs.planId, 'starter')
    });

    if (!freeConfig) {
        logger.warn("Starter plan config not found in DB. Using fallback.");
        freeConfig = {
            id: 'fallback-starter',
            planId: 'starter',
            displayName: 'Starter',
            description: 'Basic features for new kitchens',
            priceRs: 0,
            billingPeriodMonths: 1,
            commissionRate: "10.00",
            menuItemLimit: 10,
            monthlyOrderLimit: 30,
            featuredBoostLevel: 'none',
            prioritySupport: false,
            brandingTools: false,
            promotionsLevel: 'none',
            advancedAnalytics: false,
            aiPricing: false,
            autoWhatsApp: false,
            dedicatedManager: false,
            chefAssistant: false,
            digitalKhata: false,
            potluckUsesPerPeriod: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        } as any;
    }

    return {
        planId: 'starter',
        planConfig: freeConfig as any,
        subscription: null,

        canAddMenuItem: (currentCount) => {
            if (freeConfig.menuItemLimit === null) return true;
            return currentCount < freeConfig.menuItemLimit;
        },
        
        // Free tier without active sub cannot place orders
        canPlaceOrder: () => false,
        
        canCreatePotluck: () => false,
        
        hasFeature: () => false,
        
        getRemainingOrders: () => 0,
        
        getRemainingPotlucks: () => 0,
        
        getCommissionRate: () => Number(freeConfig.commissionRate),
        
        getBoostLevel: () => 'none',
        
        isActive: () => false,
    };
}

async function expireSubscription(subscriptionId: string) {
    logger.info("Auto-expiring subscription (fallback)", { subscriptionId });
    await db.update(subscriptions)
        .set({ status: 'EXPIRED', updatedAt: new Date() })
        .where(eq(subscriptions.id, subscriptionId));
}
