import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscriptions, kitchens, planConfigs, subscriptionHistory } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { stripe } from "@/lib/stripe";
import type Stripe from "stripe";
import { Redis } from "@upstash/redis";

const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
    : null;

// ─── Log to subscription history (append-only audit trail) ──────────────────

async function logSubscriptionHistory(entry: {
    kitchenId: string;
    cookId: string;
    planId: string;
    status: string;
    startedAt: Date;
    endedAt?: Date | null;
    endReason?: string | null;
    priceRsPaid: number;
    stripeSessionId?: string | null;
    metadata?: Record<string, unknown> | null;
}) {
    try {
        await db.insert(subscriptionHistory).values({
            kitchenId: entry.kitchenId,
            cookId: entry.cookId,
            planId: entry.planId as any,
            status: entry.status,
            startedAt: entry.startedAt,
            endedAt: entry.endedAt ?? null,
            endReason: entry.endReason ?? null,
            priceRsPaid: entry.priceRsPaid,
            stripeSessionId: entry.stripeSessionId ?? null,
            metadata: entry.metadata ?? null,
        });
    } catch (e) {
        console.error("[Stripe Webhook] Failed to log subscription history", e);
    }
}

// ─── Handle checkout.session.completed ──────────────────────────────────────

async function handleSubscriptionCheckout(session: Stripe.Checkout.Session) {
    const metadata = session.metadata;
    if (!metadata || !metadata.kitchenId || !metadata.planId) return;

    const planConfig = await db.query.planConfigs.findFirst({
        where: eq(planConfigs.planId, metadata.planId as any),
    });
    if (!planConfig) {
        console.error(`[Stripe Webhook] Plan config not found for ${metadata.planId}`);
        return;
    }

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + planConfig.billingPeriodMonths);

    const isUpgrade = metadata.isUpgrade === 'true';
    const previousPlanId = metadata.previousPlanId;

    // ── Handle upgrade: supersede old subscription ─────────────────
    if (isUpgrade) {
        const existing = await db.query.subscriptions.findFirst({
            where: and(
                eq(subscriptions.kitchenId, metadata.kitchenId),
                eq(subscriptions.status, 'ACTIVE'),
            ),
        });

        if (existing) {
            // 1. Mark old subscription as UPGRADED
            await db.update(subscriptions)
                .set({
                    status: 'UPGRADED',
                    updatedAt: now,
                })
                .where(eq(subscriptions.id, existing.id));

            // 2. Log old subscription to history
            await logSubscriptionHistory({
                kitchenId: metadata.kitchenId,
                cookId: metadata.cookId,
                planId: existing.planId,
                status: 'UPGRADED',
                startedAt: existing.currentPeriodStart,
                endedAt: now,
                endReason: 'UPGRADED',
                priceRsPaid: 0, // original price was already recorded
                metadata: { upgradedTo: metadata.planId },
            });
        }
    } else {
        // ── Handle non-upgrade: check for existing ACTIVE subs ──────
        const existing = await db.query.subscriptions.findFirst({
            where: and(
                eq(subscriptions.kitchenId, metadata.kitchenId),
                eq(subscriptions.status, 'ACTIVE'),
            ),
        });

        if (existing) {
            // Mark as SUPERSEDED (e.g. they renewed before expiry)
            await db.update(subscriptions)
                .set({ status: 'SUPERSEDED', updatedAt: now })
                .where(eq(subscriptions.id, existing.id));

            await logSubscriptionHistory({
                kitchenId: metadata.kitchenId,
                cookId: metadata.cookId,
                planId: existing.planId,
                status: 'SUPERSEDED',
                startedAt: existing.currentPeriodStart,
                endedAt: now,
                endReason: 'SUPERSEDED',
                priceRsPaid: 0,
            });
        }
    }

    // ── Create new subscription ──────────────────────────────────────
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
        extraOrdersLimit: 0,
        extraPotluckUses: 0,
    });

    // Log new subscription to history
    const amountPaidRs = session.amount_total ? session.amount_total / 100 : planConfig.priceRs;
    await logSubscriptionHistory({
        kitchenId: metadata.kitchenId,
        cookId: metadata.cookId,
        planId: metadata.planId,
        status: 'ACTIVE',
        startedAt: now,
        priceRsPaid: amountPaidRs,
        stripeSessionId: session.id,
        metadata: isUpgrade ? { isUpgrade: true, previousPlanId } : null,
    });

    // ── Set kitchen active and update planId ───────────────────────
    await db.update(kitchens).set({ 
        status: 'ACTIVE',
        planId: metadata.planId as any
    }).where(eq(kitchens.id, metadata.kitchenId));

    if (planConfig.featuredBoostLevel !== 'none' && planConfig.featuredBoostLevel !== null) {
        await db.update(kitchens).set({
            boostPriority: planConfig.sortOrder,
            boostExpiresAt: periodEnd,
        }).where(eq(kitchens.id, metadata.kitchenId));
    }

    // ── Invalidate access cache ─────────────────────────────────────
    const { invalidatePlanAccessCache } = await import("@/lib/plans/plan-access");
    await invalidatePlanAccessCache(metadata.kitchenId);

    // ── Notify cook ─────────────────────────────────────────────────
    try {
        const { notifySystemMessage } = await import("@/services/notification.service");
        if (isUpgrade) {
            await notifySystemMessage(
                metadata.cookId,
                `You've upgraded to ${planConfig.displayName}! Your previous ${previousPlanId} plan has ended. Fees are non-refundable.`
            );
        } else {
            await notifySystemMessage(metadata.cookId, `Your ${planConfig.displayName} subscription is now active!`);
        }
    } catch (e) {
        console.error("[Stripe Webhook] Notification failed", e);
    }
}

// ─── Handle extra pack purchase ─────────────────────────────────────────────

async function handleExtraPackCheckout(session: Stripe.Checkout.Session) {
    const metadata = session.metadata;
    if (!metadata || !metadata.kitchenId || !metadata.packType || !metadata.packSize) return;

    const { extraPacks } = await import("@/lib/db/schema");
    const packSize = parseInt(metadata.packSize);
    const subscriptionId = metadata.subscriptionId;

    // Import pack pricing to verify amount
    const { ORDER_PACKS, POTLUCK_PACKS } = await import("@/config/pack-pricing");
    const packs = metadata.packType === 'ORDER_PACK' ? ORDER_PACKS : POTLUCK_PACKS;
    const packConfig = packs.find((p: { size: number }) => p.size === packSize);

    if (!packConfig) {
        console.error(`[Stripe Webhook] Invalid pack config: ${metadata.packType} size ${packSize}`);
        return;
    }

    // Verify amount
    const amountPaid = session.amount_total ? session.amount_total / 100 : 0;
    if (amountPaid < packConfig.priceRs) {
        console.error(`[Stripe Webhook] Pack amount mismatch: paid ${amountPaid}, expected ${packConfig.priceRs}`);
        return;
    }

    const now = new Date();

    // 1. Update extraPacks row to ACTIVE
    await db.update(extraPacks)
        .set({
            status: 'ACTIVE',
            activatedAt: now,
            ordersAdded: metadata.packType === 'ORDER_PACK' ? packSize : 0,
            potluckAdded: metadata.packType === 'POTLUCK_PACK' ? packSize : 0,
        })
        .where(eq(extraPacks.stripeSessionId, session.id));

    // 2. Update subscription counters (parameterized to prevent SQL injection)
    if (metadata.packType === 'ORDER_PACK') {
        await db.execute(
            sql`UPDATE subscriptions SET extra_orders_limit = extra_orders_limit + ${packSize} WHERE id = ${subscriptionId}`
        );
    } else {
        await db.execute(
            sql`UPDATE subscriptions SET extra_potluck_uses = extra_potluck_uses + ${packSize}, potluck_uses_remaining = potluck_uses_remaining + ${packSize} WHERE id = ${subscriptionId}`
        );
    }

    // 3. Invalidate plan access cache
    const { invalidatePlanAccessCache } = await import("@/lib/plans/plan-access");
    await invalidatePlanAccessCache(metadata.kitchenId);

    // 4. Notify cook
    try {
        const { notifySystemMessage } = await import("@/services/notification.service");
        if (metadata.packType === 'ORDER_PACK') {
            await notifySystemMessage(metadata.cookId, `${packSize} extra orders added! Your order capacity has been increased.`);
        } else {
            await notifySystemMessage(metadata.cookId, `${packSize} Group Deals added to your account!`);
        }
    } catch (e) {
        console.error("[Stripe Webhook] Pack notification failed", e);
    }

    // 5. Auto-unlock kitchen if it was locked
    try {
        const kitchen = await db.query.kitchens.findFirst({
            where: eq(kitchens.id, metadata.kitchenId),
        });
        if (kitchen && (kitchen as any).isLocked) {
            const { unlockKitchen } = await import("@/services/kitchen-lock.service");
            await unlockKitchen(metadata.kitchenId);
        }
    } catch {
        // kitchen-lock service may not exist yet during Phase 2
    }
}

// ─── Main webhook event handler ─────────────────────────────────────────────

async function handleWebhookEventInline(event: Stripe.Event) {
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata;

        if (metadata?.type === 'SUBSCRIPTION') {
            await handleSubscriptionCheckout(session);
        } else if (metadata?.type === 'EXTRA_PACK') {
            await handleExtraPackCheckout(session);
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

        // Invalidate plan access cache
        const sub = await db.query.subscriptions.findFirst({
            where: eq(subscriptions.stripeSubscriptionId, subscription.id),
        });
        if (sub) {
            const { invalidatePlanAccessCache } = await import("@/lib/plans/plan-access");
            await invalidatePlanAccessCache(sub.kitchenId);
        }

    } else if (event.type === 'invoice.paid') {
        // ─── AUTO-RENEWAL SUCCESS ─────────────────────────────────────────────
        const invoice = event.data.object as Stripe.Invoice;
        const stripeSubId = (invoice as any).subscription as string;
        if (!stripeSubId) return;

        const stripeSubResponse = await stripe.subscriptions.retrieve(stripeSubId);
        const stripeSub = stripeSubResponse as unknown as Stripe.Subscription;

        await db.update(subscriptions)
            .set({
                status: 'ACTIVE',
                currentPeriodStart: new Date((stripeSub as any).current_period_start * 1000),
                currentPeriodEnd: new Date((stripeSub as any).current_period_end * 1000),
                ordersUsedThisMonth: 0, // Reset monthly usage counters
                extraOrdersLimit: 0,    // Reset extra packs on renewal
                extraPotluckUses: 0,    // Reset extra packs on renewal
                updatedAt: new Date(),
            })
            .where(eq(subscriptions.stripeSubscriptionId, stripeSubId));

        const sub = await db.query.subscriptions.findFirst({
            where: eq(subscriptions.stripeSubscriptionId, stripeSubId),
        });
        if (sub) {
            const { invalidatePlanAccessCache } = await import("@/lib/plans/plan-access");
            await invalidatePlanAccessCache(sub.kitchenId);
        }

    } else if (event.type === 'invoice.payment_failed') {
        // ─── AUTO-RENEWAL FAILED ──────────────────────────────────────────────
        const invoice = event.data.object as Stripe.Invoice;
        const stripeSubId = (invoice as any).subscription as string;
        if (!stripeSubId) return;

        await db.update(subscriptions)
            .set({ status: 'PAST_DUE', updatedAt: new Date() })
            .where(eq(subscriptions.stripeSubscriptionId, stripeSubId));

        // Notify the cook
        const sub = await db.query.subscriptions.findFirst({
            where: eq(subscriptions.stripeSubscriptionId, stripeSubId),
        });
        if (sub) {
            const { invalidatePlanAccessCache } = await import("@/lib/plans/plan-access");
            await invalidatePlanAccessCache(sub.kitchenId);

            try {
                const { notifySystemMessage } = await import("@/services/notification.service");
                await notifySystemMessage(
                    sub.userId,
                    "Your subscription renewal failed. Update your payment method to keep your kitchen active."
                );
            } catch (e) {
                console.error("[Stripe Webhook] Payment failed notification error", e);
            }
        }

    } else if (event.type === 'customer.subscription.deleted') {
        const subscription = event.data.object as Stripe.Subscription;
        
        await db.update(subscriptions)
            .set({
                status: 'CANCELLED',
                cancelledAt: new Date(),
                updatedAt: new Date()
            })
            .where(eq(subscriptions.stripeSubscriptionId, subscription.id));

        const sub = await db.query.subscriptions.findFirst({
            where: eq(subscriptions.stripeSubscriptionId, subscription.id),
        });
        if (sub) {
            const { invalidatePlanAccessCache } = await import("@/lib/plans/plan-access");
            await invalidatePlanAccessCache(sub.kitchenId);

            // Log to history
            await logSubscriptionHistory({
                kitchenId: sub.kitchenId,
                cookId: sub.userId,
                planId: sub.planId,
                status: 'CANCELLED',
                startedAt: sub.currentPeriodStart,
                endedAt: new Date(),
                endReason: 'CANCELLED',
                priceRsPaid: 0,
            });
        }
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

        // Idempotency: write key BEFORE processing
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
