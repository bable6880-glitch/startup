import { NextRequest, NextResponse } from "next/server";
import { requireSeller } from "@/lib/auth/seller-guard";
import { db } from "@/lib/db";
import { planConfigs, subscriptions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { stripe } from "@/lib/stripe";
import { Redis } from "@upstash/redis";
import { logger } from "@/lib/utils/logger";
import { z } from "zod";

const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
    : null;

const checkoutSchema = z.object({
    planId: z.enum(['starter', 'growth', 'pro', 'elite']),
});

export async function POST(request: NextRequest) {
    try {
        const guard = await requireSeller(request);
        if (!guard.ok) return guard.response;
        const { user, kitchen } = guard;

        const body = await request.json();
        const parsed = checkoutSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: "Invalid planId" }, { status: 400 });
        }

        const { planId } = parsed.data;

        // Check no active subscription exists
        const activeSub = await db.query.subscriptions.findFirst({
            where: and(
                eq(subscriptions.kitchenId, kitchen.id),
                eq(subscriptions.status, 'ACTIVE')
            ),
        });

        if (activeSub && activeSub.planId === planId) {
            return NextResponse.json({ error: "You already have this active subscription" }, { status: 409 });
        }

        // Get plan config from DB
        const planConfig = await db.query.planConfigs.findFirst({
            where: eq(planConfigs.planId, planId),
        });

        if (!planConfig) {
            return NextResponse.json({ error: "Plan configuration not found" }, { status: 404 });
        }

        if (!planConfig.stripePriceId) {
            return NextResponse.json({ error: "Plan not configured for Stripe yet. Contact support." }, { status: 500 });
        }

        // Idempotency check via Redis
        const idempotencyKey = `checkout:pending:${kitchen.id}:${planId}`;
        if (redis) {
            const existingUrl = await redis.get<string>(idempotencyKey);
            if (existingUrl) {
                return NextResponse.json({ url: existingUrl });
            }
        }

        const isRecurring = planConfig.billingPeriodMonths === 1;
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

        const session = await stripe.checkout.sessions.create({
            mode: isRecurring ? 'subscription' : 'payment',
            line_items: [{ price: planConfig.stripePriceId, quantity: 1 }],
            success_url: `${baseUrl}/dashboard/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${baseUrl}/dashboard/subscription`,
            metadata: {
                kitchenId: kitchen.id,
                cookId: user.id,
                planId: planId,
                priceRs: planConfig.priceRs.toString(),
                billingMonths: planConfig.billingPeriodMonths.toString(),
            },
            customer_email: user.email || undefined,
        });

        if (redis && session.url) {
            await redis.set(idempotencyKey, session.url, { ex: 30 * 60 }); // 30 mins TTL
        }

        return NextResponse.json({ url: session.url });
    } catch (error) {
        logger.error("Checkout session creation failed", { error });
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
