import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { subscriptions, boosts, kitchens } from "@/lib/db/schema";
import { eq, and, lt, sql } from "drizzle-orm";
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
        const providedBuffer = Buffer.from(cronSecret);
        const expectedBuffer = Buffer.from(CRON_SECRET);

        if (providedBuffer.length !== expectedBuffer.length || !timingSafeEqual(providedBuffer, expectedBuffer)) {
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
