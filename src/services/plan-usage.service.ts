import { db } from "@/lib/db";
import { subscriptions, planConfigs } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { logger } from "@/lib/utils/logger";
import { PlanLimitError } from "@/lib/plans/plan-guards";

// ─── Increment Order Count ──────────────────────────────────────────────────

export async function incrementOrderCount(subscriptionId: string): Promise<number> {
    const result = await db.update(subscriptions)
        .set({
            ordersUsedThisMonth: sql`${subscriptions.ordersUsedThisMonth} + 1`,
            updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, subscriptionId))
        .returning({ ordersUsedThisMonth: subscriptions.ordersUsedThisMonth });

    const newCount = result[0]?.ordersUsedThisMonth ?? 0;
    logger.info("Order count incremented", { subscriptionId, newCount });
    return newCount;
}

// ─── Reset Order Count ──────────────────────────────────────────────────────

export async function resetOrderCount(subscriptionId: string): Promise<void> {
    await db.update(subscriptions)
        .set({
            ordersUsedThisMonth: 0,
            ordersResetAt: new Date(),
            updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, subscriptionId));
}

// ─── Decrement Potluck Uses (Atomic) ────────────────────────────────────────

export async function decrementPotluckUses(subscriptionId: string): Promise<number> {
    // Atomic decrement with WHERE guard — prevents going below 0
    const result = await db.update(subscriptions)
        .set({
            potluckUsesRemaining: sql`${subscriptions.potluckUsesRemaining} - 1`,
            updatedAt: new Date(),
        })
        .where(
            sql`${subscriptions.id} = ${subscriptionId}
                AND ${subscriptions.potluckUsesRemaining} > 0`
        )
        .returning({ potluckUsesRemaining: subscriptions.potluckUsesRemaining });

    if (result.length === 0) {
        throw new PlanLimitError(
            'No potluck uses remaining for this billing period.',
            'POTLUCK_LIMIT_EXCEEDED',
            {
                currentPlan: null,
                limit: 0,
                upgradeUrl: '/dashboard/subscription',
            }
        );
    }

    const remaining = result[0]?.potluckUsesRemaining ?? 0;
    logger.info("Potluck use decremented", { subscriptionId, remaining });
    return remaining;
}

// ─── Restore Potluck Use (on deal cancel) ───────────────────────────────────

export async function restorePotluckUse(subscriptionId: string): Promise<void> {
    // Get the plan's max potluck uses to avoid exceeding it
    const sub = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.id, subscriptionId),
        with: { planConfig: true },
    });

    if (!sub || !sub.planConfig) return;

    const maxUses = sub.planConfig.potluckUsesPerPeriod;
    if (maxUses === -1) return; // Unlimited plan — no need to track

    // Only increment if below max
    await db.update(subscriptions)
        .set({
            potluckUsesRemaining: sql`LEAST(${subscriptions.potluckUsesRemaining} + 1, ${maxUses})`,
            updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, subscriptionId));

    logger.info("Potluck use restored (deal cancelled)", { subscriptionId });
}
