import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscriptions, planConfigs } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { logger } from "@/lib/utils/logger";
import { Redis } from "@upstash/redis";

// Check if Upstash Redis is configured
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
    : null;

export const maxDuration = 300; // 5 minutes max duration for serverless function
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
    try {
        // Basic security to ensure it's called by Vercel Cron
        const authHeader = req.headers.get("authorization");
        if (
            process.env.CRON_SECRET &&
            authHeader !== `Bearer ${process.env.CRON_SECRET}`
        ) {
            // Depending on env, allow bypassing during local development
            if (process.env.NODE_ENV === "production") {
                return new NextResponse("Unauthorized", { status: 401 });
            }
        }

        const now = new Date();
        const yearMonth = `${now.getFullYear()}-${now.getMonth() + 1}`;
        const lockKey = `cron:reset-order-counts:${yearMonth}`;

        if (redis) {
            // Idempotency: Prevent double-run in the same month
            const isLocked = await redis.get(lockKey);
            if (isLocked) {
                logger.info("Order count reset already ran this month", { yearMonth });
                return NextResponse.json({ message: "Already processed this month" });
            }
            
            // Set lock for 25 days
            await redis.set(lockKey, "LOCKED", { ex: 25 * 24 * 60 * 60 });
        }

        logger.info("Running monthly order count reset");

        // Fetch all active subscriptions with their plan configs
        const activeSubs = await db.query.subscriptions.findMany({
            where: eq(subscriptions.status, 'ACTIVE'),
            with: { planConfig: true },
        });

        let resetCount = 0;

        for (const sub of activeSubs) {
            const config = sub.planConfig;
            if (!config) continue;

            const updates: any = {
                ordersUsedThisMonth: 0,
                ordersResetAt: now,
                updatedAt: now,
            };

            // If the plan has potluck uses that reset per period, and the period is 1 month
            // For now, we'll reset potlucks if the billingPeriod is 1. 
            // Note: In an enterprise app, multi-month plans (Growth=6, Pro=12) 
            // usually give total uses for the period, so they reset on renewal, NOT monthly.
            // Starter resets monthly because it's a 1-month plan.
            if (config.billingPeriodMonths === 1 && config.potluckUsesPerPeriod > 0) {
                updates.potluckUsesRemaining = config.potluckUsesPerPeriod;
                updates.potluckUsesResetAt = now;
            }

            await db.update(subscriptions)
                .set(updates)
                .where(eq(subscriptions.id, sub.id));
                
            resetCount++;
        }

        logger.info("Completed monthly order count reset", { count: resetCount });
        return NextResponse.json({ success: true, count: resetCount });
    } catch (error) {
        logger.error("Failed to run order count reset CRON", { error });
        return NextResponse.json(
            { success: false, error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
