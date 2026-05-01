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

        const now = new Date();
        let expiredSubscriptions = 0;
        let expiredBoosts = 0;
        let suspendedKitchens = 0;

        // ── 1. Expire subscriptions past their period end ──────────────
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
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        await db.execute(sql`DELETE FROM notifications WHERE created_at < ${thirtyDaysAgo}`);

        // ── 6. Monthly Order Limit Reset (Only on 1st of the month) ─────────
        if (now.getDate() === 1) {
            await db.execute(sql`UPDATE subscriptions SET orders_used_this_month = 0, updated_at = NOW()`);
        }

        return apiSuccess({
            message: "Cleanup complete",
            expiredSubscriptions,
            suspendedKitchens,
            expiredBoosts,
            timestamp: now.toISOString(),
        });
    } catch (error) {
        console.error("[Cron Cleanup Error]", error);
        return apiInternalError("Cron cleanup failed");
    }
}
