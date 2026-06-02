import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { subscriptions, boosts, kitchens, orders, orderItems, users, adminAuditLog } from "@/lib/db/schema";
import { eq, and, lt, sql, isNull } from "drizzle-orm";
import { apiSuccess, apiUnauthorized, apiInternalError } from "@/lib/utils/api-response";
import { timingSafeEqual } from "crypto";

// CHANGED [H3]: Cron endpoint for subscription + boost expiry cleanup.
// Call via Vercel Cron or external scheduler: GET /api/cron/cleanup
// Secured by CRON_SECRET environment variable.

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
    try {
        // Auth: check Bearer token or x-cron-secret
        let cronSecret = request.headers.get("x-cron-secret");
        const authHeader = request.headers.get("authorization");
        if (!cronSecret && authHeader?.startsWith("Bearer ")) {
            cronSecret = authHeader.substring(7);
        }

        if (!CRON_SECRET || !cronSecret) {
            return apiUnauthorized("Missing cron secret");
        }

        // Timing-safe comparison to prevent timing attacks
        const a = Buffer.from(cronSecret);
        const b = Buffer.from(process.env.CRON_SECRET ?? "");

        if (a.length !== b.length || !timingSafeEqual(a, b)) {
            return apiUnauthorized("Invalid cron secret");
        }

        const startTime = Date.now();
        const now = new Date();
        console.log('[CRON:cleanup] Starting: general cleanup');
        let expiredSubscriptions = 0;
        let expiredBoosts = 0;
        let suspendedKitchens = 0;

        // ── 1. Expire subscriptions past their period end ──────────────
        console.log('[CRON:cleanup] Starting: subscription expiry');
        const expiredSubs = await db.query.subscriptions.findMany({
            where: and(
                sql`${subscriptions.status} IN ('TRIALING', 'ACTIVE')`,
                lt(subscriptions.currentPeriodEnd, now)
            ),
        });

        for (const sub of expiredSubs) {
            await db
                .update(subscriptions)
                .set({ status: "EXPIRED", updatedAt: now })
                .where(eq(subscriptions.id, sub.id));
            
            await db
                .update(kitchens)
                .set({ 
                    status: "INACTIVE", 
                    isLocked: true, 
                    lockReason: "SUBSCRIPTION_EXPIRED", 
                    lockedAt: now 
                })
                .where(eq(kitchens.id, sub.kitchenId));

            const { invalidatePlanAccessCache } = await import("@/lib/plans/plan-access");
            await invalidatePlanAccessCache(sub.kitchenId);

            expiredSubscriptions++;
        }

        // ── 2. Suspend kitchens with grace period expired ─────────────
        const pastDueSubs = await db.query.subscriptions.findMany({
            where: and(
                eq(subscriptions.status, "PAST_DUE"),
                lt(subscriptions.gracePeriodEndsAt, now)
            ),
        });

        for (const sub of pastDueSubs) {
            await db
                .update(subscriptions)
                .set({ status: "SUSPENDED", updatedAt: now })
                .where(eq(subscriptions.id, sub.id));

            await db
                .update(kitchens)
                .set({ status: "SUSPENDED", updatedAt: now })
                .where(eq(kitchens.id, sub.kitchenId));

            suspendedKitchens++;
        }

        console.log(`[CRON:cleanup] Expired ${expiredSubscriptions} subscriptions, suspended ${suspendedKitchens} kitchens`);
        // ── 3. Expire boosts past their expiry ────────────────────────
        const expiredBoostRecords = await db.query.boosts.findMany({
            where: and(
                eq(boosts.status, "ACTIVE"),
                lt(boosts.expiresAt, now)
            ),
        });

        for (const boost of expiredBoostRecords) {
            await db
                .update(boosts)
                .set({ status: "EXPIRED" })
                .where(eq(boosts.id, boost.id));

            // Reset boost priority on the kitchen
            await db
                .update(kitchens)
                .set({
                    boostPriority: 0,
                    boostExpiresAt: null,
                    updatedAt: now,
                })
                .where(eq(kitchens.id, boost.kitchenId));

            expiredBoosts++;
        }

        // ── 4. Cancel Orphan Orders ───────────────────────────────────────────
        const fiveMinsAgo = new Date(now.getTime() - 5 * 60 * 1000);
        const orphanOrders = await db
            .select({ id: orders.id })
            .from(orders)
            .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
            .where(
                and(
                    isNull(orderItems.id),
                    lt(orders.createdAt, fiveMinsAgo),
                    sql`${orders.status} != 'CANCELLED'`
                )
            );

        if (orphanOrders.length > 0) {
            const adminUser = await db.query.users.findFirst({
                where: eq(users.role, "ADMIN"),
                columns: { id: true }
            });

            for (const { id: orderId } of orphanOrders) {
                await db
                    .update(orders)
                    .set({
                        status: "CANCELLED",
                        updatedAt: now,
                        notes: sql`CONCAT(COALESCE(${orders.notes}, ''), '\n[auto-cancelled: no items found]')`,
                    })
                    .where(eq(orders.id, orderId));

                if (adminUser) {
                    await db.insert(adminAuditLog).values({
                        adminId: adminUser.id,
                        action: "AUTO_CANCEL_ORPHAN_ORDER",
                        targetType: "ORDER",
                        targetId: orderId,
                        details: "auto-cancelled: no items found",
                    });
                }
            }
        }

        // ── 5. Notification Cleanup (Delete > 30 days old) ───────────────────
        console.log('[CRON:cleanup] Starting: notification cleanup');
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        await db.execute(sql`DELETE FROM notifications WHERE created_at < ${thirtyDaysAgo}`);

        // ── 6. Monthly Order Limit Reset (Only on 1st of the month) ─────────
        // Sequential inserts — Neon HTTP does not support transactions
        let orderResetCount = 0;
        let unlockedKitchens = 0;
        if (now.getDate() === 1) {
            console.log('[CRON:cleanup] 1st of month — resetting order counts...');
            const { planConfigs } = await import("@/lib/db/schema");
            const activeSubs = await db.query.subscriptions.findMany({
                where: sql`${subscriptions.status} IN ('ACTIVE', 'TRIALING')`,
                with: { planConfig: true },
            });

            for (const sub of activeSubs) {
                const config = sub.planConfig;
                if (!config) continue;

                const updates: Record<string, unknown> = {
                    ordersUsedThisMonth: 0,
                    ordersResetAt: now,
                    updatedAt: now,
                };

                // Monthly plans (billingPeriodMonths=1) also reset potluck uses.
                // Multi-month plans (Growth=6, Pro=12, Elite=12) reset potluck on renewal, not monthly.
                if (config.billingPeriodMonths === 1 && config.potluckUsesPerPeriod > 0) {
                    updates.potluckUsesRemaining = config.potluckUsesPerPeriod;
                    updates.potluckUsesResetAt = now;
                }

                await db.update(subscriptions)
                    .set(updates as any)
                    .where(eq(subscriptions.id, sub.id));

                orderResetCount++;
            }

            // Find and unlock kitchens locked due to ORDER_LIMIT_REACHED
            const lockedKitchens = await db.query.kitchens.findMany({
                where: and(
                    eq(kitchens.isLocked, true),
                    eq(kitchens.lockReason, 'ORDER_LIMIT_REACHED')
                )
            });

            for (const kitchen of lockedKitchens) {
                await db.update(kitchens)
                    .set({
                        isLocked: false,
                        lockReason: null,
                        lockedAt: null,
                        lockedUntil: null,
                        updatedAt: now
                    })
                    .where(eq(kitchens.id, kitchen.id));
                
                const { invalidatePlanAccessCache } = await import("@/lib/plans/plan-access");
                await invalidatePlanAccessCache(kitchen.id);
                unlockedKitchens++;
            }

            console.log(`[CRON:cleanup] Reset order counts for ${orderResetCount} subscriptions, unlocked ${unlockedKitchens} kitchens`);
        } else {
            console.log('[CRON:cleanup] Skipping order count reset (not 1st of month)');
        }

        // ── 7. Daily Menu Reset (NOT_TODAY → AVAILABLE) ─────────────────────
        // Previously in /api/cron/reset-menu — merged here to stay within Vercel 2-cron limit
        let menuResetCount = 0;
        try {
            const { meals: mealsTable } = await import("@/lib/db/schema");
            const updatedMeals = await db
                .update(mealsTable)
                .set({
                    availabilityStatus: "AVAILABLE",
                    isAvailable: true,
                    updatedAt: now,
                })
                .where(eq(mealsTable.availabilityStatus, "NOT_TODAY"))
                .returning({ id: mealsTable.id });
            menuResetCount = updatedMeals.length;
        } catch (menuErr) {
            console.error("[Cron] Menu reset error:", menuErr);
        }

        const totalMs = Date.now() - startTime;
        console.log(`[CRON:cleanup] All tasks complete in ${totalMs}ms`);

        return apiSuccess({
            message: "Cleanup complete",
            expiredSubscriptions,
            suspendedKitchens,
            expiredBoosts,
            orderResetCount,
            menuResetCount,
            executionMs: totalMs,
            timestamp: now.toISOString(),
        });
    } catch (error) {
        console.error("[Cron Cleanup Error]", error);
        return apiInternalError("Cron cleanup failed");
    }
}
