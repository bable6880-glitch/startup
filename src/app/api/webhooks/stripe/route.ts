import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscriptions, kitchens, planConfigs } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { stripe } from "@/lib/stripe";
import type Stripe from "stripe";
import { Redis } from "@upstash/redis";

const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
    : null;

async function handleWebhookEventInline(event: Stripe.Event) {
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata;
        if (!metadata || metadata.type !== 'SUBSCRIPTION' || !metadata.kitchenId || !metadata.planId) return;

        const planConfig = await db.query.planConfigs.findFirst({
            where: eq(planConfigs.planId, metadata.planId as any),
        });
        if (!planConfig) {
            console.error(`[Stripe Webhook] Plan config not found for ${metadata.planId}`);
            return;
        }

        // Note: Amount might be 0 for trial/free checkout or due to promo codes.
        // We trust Stripe's checkout session completion.
        const amountPaidRs = session.amount_total ? session.amount_total / 100 : 0;
        // if (amountPaidRs < planConfig.priceRs) {
        //     console.error(`[Stripe Webhook] Amount paid (${amountPaidRs}) is less than plan price (${planConfig.priceRs})`);
        //     return; // Reject underpayment
        // }

        const now = new Date();
        const periodEnd = new Date(now);
        periodEnd.setMonth(periodEnd.getMonth() + planConfig.billingPeriodMonths);

        // Check if existing sub exists
        const existing = await db.query.subscriptions.findFirst({
            where: and(eq(subscriptions.kitchenId, metadata.kitchenId), eq(subscriptions.status, 'ACTIVE'))
        });

        if (existing) {
            // Mark existing as SUPERSEDED (e.g. they upgraded before expiry)
            await db.update(subscriptions)
                .set({ status: 'SUPERSEDED', updatedAt: now })
                .where(eq(subscriptions.id, existing.id));
        }

        await db.insert(subscriptions).values({
            userId: metadata.cookId,
            kitchenId: metadata.kitchenId,
            planId: metadata.planId as any,
            planType: "BASE_MONTHLY", // legacy field
            status: 'ACTIVE',
            paymentMethod: 'STRIPE',
            stripeSubscriptionId: typeof session.subscription === 'string' ? session.subscription : null,
            stripeCustomerId: typeof session.customer === 'string' ? session.customer : null,
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            autoRenew: !!session.subscription,
            potluckUsesRemaining: planConfig.potluckUsesPerPeriod === -1 ? 9999 : planConfig.potluckUsesPerPeriod,
        });

        // Set kitchen active
        await db.update(kitchens).set({ status: 'ACTIVE' }).where(eq(kitchens.id, metadata.kitchenId));
        
        if (planConfig.featuredBoostLevel !== 'none' && planConfig.featuredBoostLevel !== null) {
            // Set boost
            await db.update(kitchens).set({ boostPriority: planConfig.sortOrder, boostExpiresAt: periodEnd }).where(eq(kitchens.id, metadata.kitchenId));
        }

        // Invalidate access cache
        const { invalidatePlanAccessCache } = await import("@/lib/plans/plan-access");
        await invalidatePlanAccessCache(metadata.kitchenId);

        // Notify cook
        try {
            const { notifySystemMessage } = await import("@/services/notification.service");
            await notifySystemMessage(metadata.cookId, `Your ${planConfig.displayName} subscription is now active!`);
        } catch (e) {
            console.error("[Stripe Webhook] Notification failed", e);
        }
    } else if (event.type === 'customer.subscription.updated') {
        const subscription = event.data.object as Stripe.Subscription;
        
        const statusMap: Record<string, string> = {
            active: "ACTIVE",
            past_due: "PAST_DUE",
            trialing: "TRIALING",
            canceled: "CANCELLED",
            unpaid: "SUSPENDED",
        };

        const mappedStatus = statusMap[subscription.status] || "PAST_DUE";
        
        await db.update(subscriptions)
            .set({
                status: mappedStatus as any,
                currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
                updatedAt: new Date()
            })
            .where(eq(subscriptions.stripeSubscriptionId, subscription.id));
            
    } else if (event.type === 'customer.subscription.deleted') {
        const subscription = event.data.object as Stripe.Subscription;
        
        await db.update(subscriptions)
            .set({
                status: 'CANCELLED',
                cancelledAt: new Date(),
                updatedAt: new Date()
            })
            .where(eq(subscriptions.stripeSubscriptionId, subscription.id));
    }
}

/**
 * POST /api/webhooks/stripe
 * Stripe webhook handler — no auth (verified by signature).
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.text();
        const signature = request.headers.get("stripe-signature");

        if (!signature) {
            return NextResponse.json(
                { error: "Missing stripe-signature header" },
                { status: 400 }
            );
        }

        let event: Stripe.Event;

        try {
            event = stripe.webhooks.constructEvent(
                body,
                signature,
                process.env.STRIPE_WEBHOOK_SECRET!
            );
        } catch (err) {
            console.error("[Stripe Webhook] Signature verification failed:", err);
            return NextResponse.json(
                { error: "Invalid signature" },
                { status: 400 }
            );
        }

        // Idempotency: write key BEFORE processing (Rule #10)
        // If Redis is unavailable, fail-closed to prevent unguarded double-processing
        const idempotencyKey = `st:stripe:event:${event.id}`;

        if (!redis) {
            console.error("[Stripe Webhook] Redis unavailable — rejecting to prevent duplicate processing");
            return NextResponse.json(
                { error: "Service temporarily unavailable" },
                { status: 503 }
            );
        }

        const alreadyProcessed = await redis.get(idempotencyKey);
        if (alreadyProcessed) {
            console.log(`[Stripe Webhook] Duplicate event ignored: ${event.id}`);
            return NextResponse.json(
                { received: true, duplicate: true },
                { status: 200 }
            );
        }

        // Claim the event BEFORE any DB writes (24h TTL)
        await redis.set(idempotencyKey, "processing", { ex: 86400 });

        try {
            await handleWebhookEventInline(event);
            // Mark as fully processed
            await redis.set(idempotencyKey, "done", { ex: 86400 });
        } catch (error) {
            // Delete idempotency key on failure to allow Stripe retries
            await redis.del(idempotencyKey);
            throw error;
        }

        return NextResponse.json({ received: true }, { status: 200 });
    } catch (error) {
        console.error("[Stripe Webhook Error]", error);
        return NextResponse.json(
            { error: "Webhook processing failed" },
            { status: 500 }
        );
    }
}
