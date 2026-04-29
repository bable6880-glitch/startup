import { getKitchenPlanAccess, PlanFeature } from "./plan-access";
import { db } from "@/lib/db";
import { meals, planUsageLog } from "@/lib/db/schema";
import { and, eq, isNull, count } from "drizzle-orm";

export class PlanLimitError extends Error {
    constructor(
        message: string,
        public readonly limitType: 'MENU_ITEM_LIMIT' | 'ORDER_LIMIT' | 'POTLUCK_LIMIT',
        public readonly currentPlanId: string
    ) {
        super(message);
        this.name = 'PlanLimitError';
    }
}

export class PlanFeatureError extends Error {
    constructor(
        message: string,
        public readonly feature: PlanFeature,
        public readonly currentPlanId: string
    ) {
        super(message);
        this.name = 'PlanFeatureError';
    }
}

export async function guardMenuItemLimit(kitchenId: string): Promise<void> {
    const access = await getKitchenPlanAccess(kitchenId);

    const currentCountResult = await db
        .select({ count: count() })
        .from(meals)
        .where(
            and(
                eq(meals.kitchenId, kitchenId),
                isNull(meals.deletedAt)
            )
        );

    const c = currentCountResult[0]?.count ?? 0;

    if (!access.canAddMenuItem(c)) {
        if (access.subscription) {
            // Log attempt for analytics
            await db.insert(planUsageLog).values({
                kitchenId,
                subscriptionId: access.subscription.id,
                actionType: 'MENU_ITEM_ADDED',
                currentUsage: c,
                limitValue: access.planConfig.menuItemLimit,
                wasAllowed: false,
            });
        }

        throw new PlanLimitError(
            `Your ${access.planConfig.displayName} plan allows up to ${access.planConfig.menuItemLimit} menu items. Upgrade to add more.`,
            'MENU_ITEM_LIMIT',
            access.planId
        );
    }
}

export async function guardOrderLimit(kitchenId: string): Promise<void> {
    const access = await getKitchenPlanAccess(kitchenId);

    if (!access.canPlaceOrder(access.subscription?.ordersUsedThisMonth ?? 0)) {
        throw new PlanLimitError(
            `Kitchen has reached its monthly order limit. Cook needs to upgrade their plan.`,
            'ORDER_LIMIT',
            access.planId
        );
    }
}

export async function guardFeatureAccess(kitchenId: string, feature: PlanFeature): Promise<void> {
    const access = await getKitchenPlanAccess(kitchenId);

    if (!access.hasFeature(feature)) {
        throw new PlanFeatureError(
            `This feature requires a higher plan.`,
            feature,
            access.planId
        );
    }
}
