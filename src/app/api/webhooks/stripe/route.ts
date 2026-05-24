import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscriptions, kitchens, planConfigs, subscriptionHistory, stripeProcessedEvents } from "@/lib/db/schema";
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

async function logSubscriptionHistory(tx: any, entry: {
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
        await tx.insert(subscriptionHistory).values({
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

export async function handleSubscriptionCheckout(tx: any, session: Stripe.Checkout.Session) {
    const metadata = session.metadata;
    if (!metadata || !metadata.kitchenId || !metadata.planId) return;

    const planConfig = await tx.query.planConfigs.findFirst({
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
        const existing = await tx.query.subscriptions.findFirst({
            where: and(
                eq(subscriptions.kitchenId, metadata.kitchenId),
                eq(subscriptions.status, 'ACTIVE'),
            ),
        });

        if (existing) {
            // 1. Mark old subscription as UPGRADED
            await tx.update(subscriptions)
                .set({
                    status: 'UPGRADED',
                    updatedAt: now,
                })
                .where(eq(subscriptions.id, existing.id));

            // 2. Log old subscription to history
            await logSubscriptionHistory(tx, {
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
        const existing = await tx.query.subscriptions.findFirst({
            where: and(
                eq(subscriptions.kitchenId, metadata.kitchenId),
                eq(subscriptions.status, 'ACTIVE'),
            ),
        });

        if (existing) {
            // Mark as SUPERSEDED (e.g. they renewed before expiry)
            await tx.update(subscriptions)
                .set({ status: 'SUPERSEDED', updatedAt: now })
                .where(eq(subscriptions.id, existing.id));

            await logSubscriptionHistory(tx, {
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
    await tx.insert(subscriptions).values({
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
    await logSubscriptionHistory(tx, {
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
    await tx.update(kitchens).set({ 
        status: 'ACTIVE',
        planId: metadata.planId as any
    }).where(eq(kitchens.id, metadata.kitchenId));

    if (planConfig.featuredBoostLevel !== 'none' && planConfig.featuredBoostLevel !== null) {
        await tx.update(kitchens).set({
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

async function handleExtraPackCheckout(tx: any, session: Stripe.Checkout.Session) {
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
    await tx.update(extraPacks)
        .set({
            status: 'ACTIVE',
            activatedAt: now,
            ordersAdded: metadata.packType === 'ORDER_PACK' ? packSize : 0,
            potluckAdded: metadata.packType === 'POTLUCK_PACK' ? packSize : 0,
        })
        .where(eq(extraPacks.stripeSessionId, session.id));

    // 2. Update subscription counters (parameterized to prevent SQL injection)
    if (metadata.packType === 'ORDER_PACK') {
        await tx.execute(
            sql`UPDATE subscriptions SET extra_orders_limit = extra_orders_limit + ${packSize} WHERE id = ${subscriptionId}`
        );
    } else {
        await tx.execute(
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
        const kitchen = await tx.query.kitchens.findFirst({
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

async function handleWebhookEventInline(tx: any, event: Stripe.Event) {
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata;

        if (metadata?.type === 'SUBSCRIPTION') {
            await handleSubscriptionCheckout(tx, session);
        } else if (metadata?.type === 'EXTRA_PACK') {
            await handleExtraPackCheckout(tx, session);
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

        // ── Resolve planId from Stripe price ID ─────────────────────────
        const stripePriceId = subscription.items?.data?.[0]?.price?.id ?? null;
        let resolvedPlanId: string | null = null;
        if (stripePriceId) {
            const matchedPlan = await tx.query.planConfigs.findFirst({
                where: eq(planConfigs.stripePriceId, stripePriceId),
            });
            if (matchedPlan) {
                resolvedPlanId = matchedPlan.planId;
            } else {
                console.warn(`[Stripe Webhook] No plan_config found for Stripe price ${stripePriceId}`);
            }
        }

        // ── Build update payload ─────────────────────────────────────────
        const updatePayload: Record<string, any> = {
            status: mappedStatus as any,
            currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
            updatedAt: new Date(),
        };
        if (resolvedPlanId) {
            updatePayload.planId = resolvedPlanId;
        }

        await tx.update(subscriptions)
            .set(updatePayload)
            .where(eq(subscriptions.stripeSubscriptionId, subscription.id));

        // ── Sync planId to kitchens table & invalidate cache ────────────
        const sub = await tx.query.subscriptions.findFirst({
            where: eq(subscriptions.stripeSubscriptionId, subscription.id),
        });
        if (sub) {
            if (resolvedPlanId) {
                await tx.update(kitchens)
                    .set({ planId: resolvedPlanId as any, updatedAt: new Date() })
                    .where(eq(kitchens.id, sub.kitchenId));
            }
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

        // ── Resolve planId from Stripe price ID on renewal ──────────────
        const renewalPriceId = stripeSub.items?.data?.[0]?.price?.id ?? null;
        let renewedPlanId: string | null = null;
        if (renewalPriceId) {
            const matchedPlan = await tx.query.planConfigs.findFirst({
                where: eq(planConfigs.stripePriceId, renewalPriceId),
            });
            if (matchedPlan) {
                renewedPlanId = matchedPlan.planId;
            } else {
                console.warn(`[Stripe Webhook] No plan_config found for renewal price ${renewalPriceId}`);
            }
        }

        // ── Build update payload ─────────────────────────────────────────
        const renewalUpdate: Record<string, any> = {
            status: 'ACTIVE',
            currentPeriodStart: new Date((stripeSub as any).current_period_start * 1000),
            currentPeriodEnd: new Date((stripeSub as any).current_period_end * 1000),
            ordersUsedThisMonth: 0, // Reset monthly usage counters
            extraOrdersLimit: 0,    // Reset extra packs on renewal
            extraPotluckUses: 0,    // Reset extra packs on renewal
            updatedAt: new Date(),
        };
        if (renewedPlanId) {
            renewalUpdate.planId = renewedPlanId;
        }

        await tx.update(subscriptions)
            .set(renewalUpdate)
            .where(eq(subscriptions.stripeSubscriptionId, stripeSubId));

        // ── Sync planId to kitchens table & invalidate cache ────────────
        const sub = await tx.query.subscriptions.findFirst({
            where: eq(subscriptions.stripeSubscriptionId, stripeSubId),
        });
        if (sub) {
            if (renewedPlanId) {
                await tx.update(kitchens)
                    .set({ planId: renewedPlanId as any, updatedAt: new Date() })
                    .where(eq(kitchens.id, sub.kitchenId));
            }
            const { invalidatePlanAccessCache } = await import("@/lib/plans/plan-access");
            await invalidatePlanAccessCache(sub.kitchenId);
        }

    } else if (event.type === 'invoice.payment_failed') {
        // ─── AUTO-RENEWAL FAILED ──────────────────────────────────────────────
        const invoice = event.data.object as Stripe.Invoice;
        const stripeSubId = (invoice as any).subscription as string;
        if (!stripeSubId) return;

        await tx.update(subscriptions)
            .set({ status: 'PAST_DUE', updatedAt: new Date() })
            .where(eq(subscriptions.stripeSubscriptionId, stripeSubId));

        // Notify the cook
        const sub = await tx.query.subscriptions.findFirst({
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
        
        await tx.update(subscriptions)
            .set({
                status: 'CANCELLED',
                cancelledAt: new Date(),
                updatedAt: new Date()
            })
            .where(eq(subscriptions.stripeSubscriptionId, subscription.id));

        const sub = await tx.query.subscriptions.findFirst({
            where: eq(subscriptions.stripeSubscriptionId, subscription.id),
        });
        if (sub) {
            // ── Clear planId from kitchen on full cancellation ───────────
            await tx.update(kitchens)
                .set({ planId: null, updatedAt: new Date() })
                .where(eq(kitchens.id, sub.kitchenId));

            const { invalidatePlanAccessCache } = await import("@/lib/plans/plan-access");
            await invalidatePlanAccessCache(sub.kitchenId);

            // Log to history
            await logSubscriptionHistory(tx, {
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
    let event: Stripe.Event;
    try {
        const body = await request.text();
        const signature = request.headers.get("stripe-signature");

        if (!signature) {
            return NextResponse.json(
                { error: "Missing stripe-signature header" },
                { status: 400 }
            );
        }

        try {
            // Phase 7: Security Hardening
            // Explicitly set 5-minute timestamp tolerance to prevent replay attacks
            event = stripe.webhooks.constructEvent(
                body,
                signature,
                process.env.STRIPE_WEBHOOK_SECRET!,
                300
            );
            console.log(`[Stripe Webhook] 🔒 Authenticated event ${event.id} of type ${event.type}`);
        } catch (err) {
            console.error("[Stripe Webhook] 🚨 Signature/Timestamp verification failed:", err);
            return NextResponse.json(
                { error: "Invalid signature" },
                { status: 400 }
            );
        }

        // ── Phase 1: Database-backed Event Check & Idempotency ────────────
        const existingEvent = await db.query.stripeProcessedEvents.findFirst({
            where: eq(stripeProcessedEvents.id, event.id),
        });

        if (existingEvent) {
            if (existingEvent.status === "completed") {
                console.log(`[Stripe Webhook] ♻️ Event already processed (idempotent skip): ${event.id}`);
                return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
            }
            if (existingEvent.status === "processing") {
                console.log(`[Stripe Webhook] ⏳ Event currently processing (race condition skip): ${event.id}`);
                return NextResponse.json({ received: true, pending: true }, { status: 202 });
            }
        }

        // Database Lock Insertion
        try {
            await db.insert(stripeProcessedEvents).values({
                id: event.id,
                type: event.type,
                status: "processing",
            });
        } catch (err) {
            // Concurrent race lock hit
            const retryCheck = await db.query.stripeProcessedEvents.findFirst({
                where: eq(stripeProcessedEvents.id, event.id),
            });
            if (retryCheck) {
                if (retryCheck.status === "completed") {
                    return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
                }
                if (retryCheck.status === "processing") {
                    return NextResponse.json({ received: true, pending: true }, { status: 202 });
                }
            }
        }

        // Redis Event claiming
        const idempotencyKey = `st:stripe:event:${event.id}`;
        if (redis) {
            await redis.set(idempotencyKey, "processing", { ex: 86400 });
        }

        // ── Phase 2: Transaction Safety Drizzle execution ─────────────────
        try {
            await db.transaction(async (tx) => {
                await handleWebhookEventInline(tx, event);

                // Update processed events tracking table to completed
                await tx.update(stripeProcessedEvents)
                    .set({
                        status: "completed",
                        processedAt: new Date(),
                    })
                    .where(eq(stripeProcessedEvents.id, event.id));
                
                console.log(`[Stripe Webhook] ✅ Successfully processed event: ${event.id}`);
            });

            if (redis) {
                await redis.set(idempotencyKey, "done", { ex: 86400 });
            }

            return NextResponse.json({ received: true }, { status: 200 });

        } catch (txError: any) {
            console.error(`[Stripe Webhook tx error for event ${event.id}]:`, txError);
            
            // Database recovery rollback logging
            await db.update(stripeProcessedEvents)
                .set({
                    status: "failed",
                    error: txError instanceof Error ? txError.message : String(txError),
                })
                .where(eq(stripeProcessedEvents.id, event.id));

            if (redis) {
                await redis.del(idempotencyKey);
            }

            console.error(`[Stripe Webhook] ❌ Transaction aborted & rolled back for event ${event.id}`);
            throw txError;
        }

    } catch (error) {
        console.error("[Stripe Webhook Error]", error);
        return NextResponse.json(
            { error: "Webhook processing failed" },
            { status: 500 }
        );
    }
}

