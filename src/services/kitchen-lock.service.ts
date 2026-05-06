// ─── Kitchen Lock Service ───────────────────────────────────────────────────
// Server-side enforcement of kitchen locking. Kitchens are locked when:
// 1. Monthly order limit is reached (ORDER_LIMIT_REACHED)
// 2. Subscription expires without renewal (SUBSCRIPTION_EXPIRED)
// 3. Payment fails after grace period (PAYMENT_FAILED)
// Kitchens are unlocked when:
// 1. Extra order pack is purchased
// 2. Plan is upgraded
// 3. Monthly counters are reset (cron)
// 4. Subscription is renewed

import { db } from "@/lib/db";
import { kitchens } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/utils/logger";

export type LockReason =
    | "ORDER_LIMIT_REACHED"
    | "SUBSCRIPTION_EXPIRED"
    | "PAYMENT_FAILED"
    | "ADMIN_ACTION";

/**
 * Lock a kitchen — prevents new orders from being placed.
 * This is enforced server-side in the order creation route.
 */
export async function lockKitchen(
    kitchenId: string,
    reason: LockReason,
    lockedUntil?: Date | null
): Promise<void> {
    try {
        await db.update(kitchens)
            .set({
                isLocked: true,
                lockReason: reason,
                lockedAt: new Date(),
                lockedUntil: lockedUntil ?? null,
                updatedAt: new Date(),
            })
            .where(eq(kitchens.id, kitchenId));

        logger.info("Kitchen locked", { kitchenId, reason });
    } catch (error) {
        logger.error("Failed to lock kitchen", { kitchenId, reason, error });
        throw error;
    }
}

/**
 * Unlock a kitchen — allows orders to be placed again.
 * Called after pack purchase, plan upgrade, or monthly reset.
 */
export async function unlockKitchen(kitchenId: string): Promise<void> {
    try {
        await db.update(kitchens)
            .set({
                isLocked: false,
                lockReason: null,
                lockedAt: null,
                lockedUntil: null,
                updatedAt: new Date(),
            })
            .where(eq(kitchens.id, kitchenId));

        logger.info("Kitchen unlocked", { kitchenId });
    } catch (error) {
        logger.error("Failed to unlock kitchen", { kitchenId, error });
        throw error;
    }
}

/**
 * Check if a kitchen is currently locked.
 * Returns the lock reason if locked, null if not.
 */
export async function getKitchenLockStatus(kitchenId: string): Promise<{
    isLocked: boolean;
    lockReason: string | null;
    lockedAt: Date | null;
    lockedUntil: Date | null;
}> {
    const kitchen = await db.query.kitchens.findFirst({
        where: eq(kitchens.id, kitchenId),
        columns: {
            isLocked: true,
            lockReason: true,
            lockedAt: true,
            lockedUntil: true,
        },
    });

    if (!kitchen) {
        return { isLocked: false, lockReason: null, lockedAt: null, lockedUntil: null };
    }

    // Auto-unlock if lockedUntil has passed
    if (kitchen.isLocked && kitchen.lockedUntil && new Date() > kitchen.lockedUntil) {
        await unlockKitchen(kitchenId);
        return { isLocked: false, lockReason: null, lockedAt: null, lockedUntil: null };
    }

    return {
        isLocked: kitchen.isLocked,
        lockReason: kitchen.lockReason,
        lockedAt: kitchen.lockedAt,
        lockedUntil: kitchen.lockedUntil,
    };
}

/**
 * Auto-lock check after an order is placed.
 * Should be called AFTER incrementing the order counter.
 * If the kitchen has now reached its limit, lock it.
 */
export async function checkAndLockIfLimitReached(kitchenId: string): Promise<boolean> {
    try {
        const { getKitchenPlanAccess } = await import("@/lib/plans/plan-access");
        const access = await getKitchenPlanAccess(kitchenId);

        if (access.isFree) return false;

        const limit = access.getOrderLimit();
        const used = access.getOrdersUsed();

        if (limit !== null && used >= limit) {
            await lockKitchen(kitchenId, "ORDER_LIMIT_REACHED");
            
            // Notify the cook
            try {
                const kitchen = await db.query.kitchens.findFirst({
                    where: eq(kitchens.id, kitchenId),
                    columns: { ownerId: true },
                });
                if (kitchen) {
                    const { notifySystemMessage } = await import("@/services/notification.service");
                    await notifySystemMessage(
                        kitchen.ownerId,
                        `Your kitchen has been temporarily locked — you've reached your monthly order limit (${limit}). Purchase an extra order pack or upgrade your plan to continue accepting orders.`
                    );
                }
            } catch {
                // Notification is non-critical
            }

            return true;
        }

        return false;
    } catch (error) {
        logger.error("Failed to check and lock kitchen", { kitchenId, error });
        return false;
    }
}
