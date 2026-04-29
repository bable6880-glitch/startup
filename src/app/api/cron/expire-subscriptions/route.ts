import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscriptions, kitchens } from "@/lib/db/schema";
import { lt, eq, and, sql } from "drizzle-orm";
import { logger } from "@/lib/utils/logger";
import { Redis } from "@upstash/redis";

const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
    : null;

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get("authorization");
        if (
            process.env.CRON_SECRET &&
            authHeader !== `Bearer ${process.env.CRON_SECRET}`
        ) {
            if (process.env.NODE_ENV === "production") {
                return new NextResponse("Unauthorized", { status: 401 });
            }
        }

        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const lockKey = `cron:expire-subs:${dateStr}`;

        if (redis) {
            const isLocked = await redis.get(lockKey);
            if (isLocked) {
                return NextResponse.json({ message: "Already processed today" });
            }
            await redis.set(lockKey, "LOCKED", { ex: 24 * 60 * 60 });
        }

        logger.info("Running daily subscription expiration check");

        // Find active subscriptions that have passed their currentPeriodEnd
        const expiredSubs = await db.query.subscriptions.findMany({
            where: and(
                eq(subscriptions.status, 'ACTIVE'),
                lt(subscriptions.currentPeriodEnd, now)
            ),
        });

        let expireCount = 0;

        for (const sub of expiredSubs) {
            // For Stripe subscriptions, we usually let the webhook handle it.
            // But if it's past due and no webhook arrived, we suspend it.
            // For non-auto-renew (one-time payments), we mark EXPIRED.
            const newStatus = sub.autoRenew ? 'PAST_DUE' : 'EXPIRED';

            await db.update(subscriptions)
                .set({
                    status: newStatus,
                    updatedAt: now,
                })
                .where(eq(subscriptions.id, sub.id));

            // Suspend kitchen if expired/past due
            await db.update(kitchens)
                .set({ status: 'SUSPENDED', updatedAt: now })
                .where(eq(kitchens.id, sub.kitchenId));

            expireCount++;
        }

        logger.info("Completed subscription expiration check", { count: expireCount });
        return NextResponse.json({ success: true, count: expireCount });
    } catch (error) {
        logger.error("Failed to run expire subscriptions CRON", { error });
        return NextResponse.json(
            { success: false, error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
