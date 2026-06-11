import { getKitchenPlanAccess, getMinimumPlanForFeature, PlanFeature } from "./plan-access";
import { db } from "@/lib/db";
import { meals, planUsageLog } from "@/lib/db/schema";
import { and, eq, isNull, count, ne, or } from "drizzle-orm";
import { AppError } from "@/lib/utils/errors";

// ─── Plan Error Classes (extend AppError) ───────────────────────────────────

export class PlanLimitError extends AppError {
    public readonly planDetails: {
        currentPlan: string | null;
        limit: number | null;
        upgradeUrl: string;
    };

    constructor(
        message: string,
        code: string,
        planDetails: {
            currentPlan: string | null;
            limit: number | null;
            upgradeUrl: string;
        }
    ) {
        super(message, code, 429);
        this.planDetails = planDetails;
        this.name = 'PlanLimitError';
    }
}

export class PlanFeatureError extends AppError {
    public readonly planDetails: {
        feature: string;
        requiredPlan: string;
        upgradeUrl: string;
    };

    constructor(
        message: string,
        code: string,
        planDetails: {
            feature: string;
            requiredPlan: string;
            upgradeUrl: string;
        }
    ) {
        super(message, code, 403);
        this.planDetails = planDetails;
        this.name = 'PlanFeatureError';
    }
}

// ─── Guard: Menu Item Limit ─────────────────────────────────────────────────

export async function guardMenuItemLimit(kitchenId: string): Promise<void> {
    const access = await getKitchenPlanAccess(kitchenId);

    const currentCountResult = await db
        .select({ count: count() })
        .from(meals)
        .where(
            and(
                eq(meals.kitchenId, kitchenId),
                isNull(meals.deletedAt),
                or(ne(meals.category, 'Potluck Special'), isNull(meals.category))
            )
        );

    const c = currentCountResult[0]?.count ?? 0;

    if (!access.canAddMenuItem(c)) {
        // Log the denied attempt for analytics
        if (access.subscription) {
            await db.insert(planUsageLog).values({
                kitchenId,
                subscriptionId: access.subscription.id,
                actionType: 'MENU_ITEM_ADD_DENIED',
                currentUsage: c,
                limitValue: access.getMenuLimit(),
                wasAllowed: false,
            });
        }

        const limit = access.getMenuLimit();
        throw new PlanLimitError(
            `Your ${access.planId ? access.planId.charAt(0).toUpperCase() + access.planId.slice(1) : 'free'} plan allows up to ${limit} menu items. Upgrade to add more.`,
            'MENU_LIMIT_EXCEEDED',
            {
                currentPlan: access.planId,
                limit,
                upgradeUrl: '/dashboard/subscription',
            }
        );
    }
}

// ─── Guard: Order Limit ─────────────────────────────────────────────────────

export async function guardOrderLimit(kitchenId: string): Promise<void> {
    const access = await getKitchenPlanAccess(kitchenId);

    if (!access.canPlaceOrder()) {
        const limit = access.getOrderLimit();
        throw new PlanLimitError(
            `Kitchen has reached its monthly order limit of ${limit} orders.`,
            'ORDER_LIMIT_EXCEEDED',
            {
                currentPlan: access.planId,
                limit,
                upgradeUrl: '/dashboard/subscription',
            }
        );
    }
}

// ─── Guard: Potluck Creation ────────────────────────────────────────────────

export async function guardPotluckCreation(kitchenId: string): Promise<void> {
    const access = await getKitchenPlanAccess(kitchenId);

    if (!access.canCreatePotluck()) {
        throw new PlanLimitError(
            'You have used all your Group Deal uses for this billing period. Upgrade your plan for more.',
            'POTLUCK_LIMIT_EXCEEDED',
            {
                currentPlan: access.planId,
                limit: access.getPotluckRemaining(),
                upgradeUrl: '/dashboard/subscription',
            }
        );
    }
}

// ─── Guard: Feature Access ──────────────────────────────────────────────────

export async function guardFeatureAccess(kitchenId: string, feature: PlanFeature): Promise<void> {
    const access = await getKitchenPlanAccess(kitchenId);

    if (!access.hasFeature(feature)) {
        const requiredPlan = getMinimumPlanForFeature(feature);
        throw new PlanFeatureError(
            `This feature requires the ${requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1)} plan or higher.`,
            'PLAN_FEATURE_REQUIRED',
            {
                feature,
                requiredPlan,
                upgradeUrl: '/dashboard/subscription',
            }
        );
    }
}
