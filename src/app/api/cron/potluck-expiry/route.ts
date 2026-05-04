import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { potluckDeals, potluckOrders, subscriptions, kitchens } from "@/lib/db/schema";
import { lt, eq, and } from "drizzle-orm";
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
        const hourStr = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}`;
        const lockKey = `cron:potluck-expiry:${hourStr}`;

        if (redis) {
            const isLocked = await redis.get(lockKey);
            if (isLocked) {
                return NextResponse.json({ message: "Already processed this hour" });
            }
            await redis.set(lockKey, "LOCKED", { ex: 60 * 60 });
        }

        logger.info("Running potluck expiry + subscription expiry check");

        // ── 1. Potluck Expiry (original) ─────────────────────────────────────
        const expiredDeals = await db.query.potluckDeals.findMany({
            where: and(
                eq(potluckDeals.status, 'ACTIVE'),
                lt(potluckDeals.expiresAt, now)
            ),
        });

        let expireCount = 0;

        for (const deal of expiredDeals) {
            await db.update(potluckDeals)
                .set({
                    status: 'EXPIRED',
                    updatedAt: now,
                })
                .where(eq(potluckDeals.id, deal.id));
            expireCount++;
            // Cancel associated RESERVED orders and notify customers
            const reservedOrders = await db.query.potluckOrders.findMany({
                where: and(
                    eq(potluckOrders.potluckDealId, deal.id),
                    eq(potluckOrders.status, 'RESERVED')
                )
            });

            if (reservedOrders.length > 0) {
                await db.update(potluckOrders)
                    .set({ status: 'CANCELLED' })
                    .where(
                        and(
                            eq(potluckOrders.potluckDealId, deal.id),
                            eq(potluckOrders.status, 'RESERVED')
                        )
                    );

                const { notifySystemMessage } = await import("@/services/notification.service");
                for (const order of reservedOrders) {
                    try {
                        await notifySystemMessage(
                            order.customerId,
                            `Your reservation for "${deal.title}" was cancelled because the deal expired before reaching its target.`
                        );
                    } catch (e) {
                        logger.error("Failed to notify customer of potluck expiry", { orderId: order.id });
                    }
                }
            }

            if (redis) {
                await redis.publish('potluck_updates', JSON.stringify({
                    type: 'DEAL_EXPIRED',
                    dealId: deal.id
                }));
            }
        }

        // ── 2. Subscription Expiry (merged from /api/cron/expire-subscriptions) ──
        // Previously a separate cron — merged here to stay within Vercel 2-cron limit
        let subExpireCount = 0;
        try {
            const expiredSubs = await db.query.subscriptions.findMany({
                where: and(
                    eq(subscriptions.status, 'ACTIVE'),
                    lt(subscriptions.currentPeriodEnd, now)
                ),
            });

            for (const sub of expiredSubs) {
                const newStatus = sub.autoRenew ? 'PAST_DUE' : 'EXPIRED';

                await db.update(subscriptions)
                    .set({
                        status: newStatus,
                        updatedAt: now,
                    })
                    .where(eq(subscriptions.id, sub.id));

                await db.update(kitchens)
                    .set({ status: 'SUSPENDED', updatedAt: now })
                    .where(eq(kitchens.id, sub.kitchenId));

                subExpireCount++;
            }
        } catch (subErr) {
            logger.error("Subscription expiry error in potluck-expiry cron", { error: subErr });
        }

        logger.info("Completed potluck + subscription expiry check", {
            potluckExpired: expireCount,
            subscriptionsExpired: subExpireCount,
        });

        return NextResponse.json({
            success: true,
            potluckExpired: expireCount,
            subscriptionsExpired: subExpireCount,
        });
    } catch (error) {
        logger.error("Failed to run potluck-expiry CRON", { error });
        return NextResponse.json(
            { success: false, error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
