import { NextRequest, NextResponse } from "next/server";
import { requireSeller } from "@/lib/auth/seller-guard";
import { db } from "@/lib/db";
import { planConfigs, subscriptions } from "@/lib/db/schema";
import { eq, and, inArray, gt } from "drizzle-orm";
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

        // ── Check current subscription status ──────────────────────────
        const activeSub = await db.query.subscriptions.findFirst({
            where: and(
                eq(subscriptions.kitchenId, kitchen.id),
                inArray(subscriptions.status, ['ACTIVE', 'TRIALING']),
                gt(subscriptions.currentPeriodEnd, new Date()),
            ),
            with: { planConfig: true },
        });

        // ── Decision matrix ──────────────────────────────────────────────
        // ALLOW if: no active sub (first time, renewal after expiry, restart after cancel)
        // ALLOW if: active sub + DIFFERENT plan (upgrade)
        // BLOCK if: active sub + SAME plan (duplicate purchase)

        let isUpgrade = false;
        let previousPlanId: string | null = null;

        if (activeSub) {
            if (activeSub.planId === planId) {
                // BLOCK: same plan while active
                const endDate = activeSub.currentPeriodEnd?.toLocaleDateString('en-PK') ?? 'end of billing cycle';
                const planName = activeSub.planConfig?.displayName ?? activeSub.planId;
                return NextResponse.json({
                    error: `You already have an active ${planName} plan. It expires on ${endDate}. You can renew after it expires.`
                }, { status: 409 });
            }

            // ALLOW: different plan (upgrade)
            isUpgrade = true;
            previousPlanId = activeSub.planId;
        }

        // Get plan config from DB
        const planConfig = await db.query.planConfigs.findFirst({
            where: eq(planConfigs.planId, planId),
        });

        if (!planConfig) {
            return NextResponse.json({ error: "Plan configuration not found. Please ensure your database is seeded with Stripe price IDs." }, { status: 404 });
        }

        if (!planConfig.stripePriceId) {
            return NextResponse.json({ error: "Plan not configured for Stripe yet. Contact support." }, { status: 500 });
        }

        // ── Idempotency check via Redis ─────────────────────────────────
        // Skip idempotency for upgrades (always create fresh session)
        const idempotencyKey = `checkout:pending:${kitchen.id}:${planId}`;
        if (redis && !isUpgrade) {
            const existingUrl = await redis.get<string>(idempotencyKey);
            if (existingUrl) {
                return NextResponse.json({ success: true, data: { url: existingUrl } });
            }
        }

        const isRecurring = planConfig.billingPeriodMonths === 1;
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

        const session = await stripe.checkout.sessions.create({
            mode: isRecurring ? 'subscription' : 'payment',
            line_items: [{ price: planConfig.stripePriceId, quantity: 1 }],
            success_url: `${baseUrl}/dashboard/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${baseUrl}/dashboard/subscription?status=cancelled`,
            metadata: {
                type: 'SUBSCRIPTION',
                kitchenId: kitchen.id,
                cookId: user.id,
                planId: planId,
                priceRs: planConfig.priceRs.toString(),
                billingMonths: planConfig.billingPeriodMonths.toString(),
                // Upgrade metadata
                ...(isUpgrade ? {
                    isUpgrade: 'true',
                    previousPlanId: previousPlanId!,
                } : {}),
            },
            customer_email: user.email || undefined,
        });

        if (redis && session.url && !isUpgrade) {
            await redis.set(idempotencyKey, session.url, { ex: 30 * 60 }); // 30 mins TTL
        }

        return NextResponse.json({ success: true, data: { url: session.url } });
    } catch (error) {
        logger.error("Checkout session creation failed", { error });
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
