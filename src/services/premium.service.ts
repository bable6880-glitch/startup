/**
 * @migrated 2026-05-10
 * Previously queried the legacy `premium_plans` table.
 * Now queries `plan_configs` (the active plan system).
 * The legacy table has been dropped from the DB.
 * Do not re-introduce premium_plans queries here.
 */
import { db } from "@/lib/db";
import {
    subscriptions,
    boosts,
    kitchens,
    planConfigs,
} from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { cached, invalidateCache, CacheKeys, CacheTTL } from "@/lib/redis";
import { NotFoundError, ConflictError } from "@/lib/utils/errors";
import { logger } from "@/lib/utils/logger";
import {
    SUBSCRIPTION_PLANS,
    GRACE_PERIOD_DAYS,
    type SubscriptionPlanType,
} from "@/lib/validations/subscription";

import { stripe } from "@/lib/stripe";
import Stripe from "stripe"
// ─── Cache Keys ─────────────────────────────────────────────────────────────

const SubscriptionCacheKeys = {
    status: (kitchenId: string) => `subscription:status:${kitchenId}`,
};

const SUBSCRIPTION_CACHE_TTL = 60; // 60 seconds

// ─── Types ──────────────────────────────────────────────────────────────────

export type SubscriptionStatusResult = {
    status:
    | "TRIALING"
    | "ACTIVE"
    | "PAST_DUE"
    | "SUSPENDED"
    | "EXPIRED"
    | "CANCELLED"
    | "NONE";
    subscription: (typeof subscriptions.$inferSelect & { planConfig?: typeof planConfigs.$inferSelect | null }) | null;
    daysRemaining: number;
    gracePeriodEndsAt: Date | null;
    canAcceptOrders: boolean;
};

// ─── List Plans ─────────────────────────────────────────────────────────────
// MIGRATION: Now queries plan_configs instead of premium_plans.
// The cache key remains `plans:{region}` for backward compatibility.

export async function listPlans(region = "PK") {
    return cached(CacheKeys.planConfigs(region), CacheTTL.PLANS, async () => {
        return db.query.planConfigs.findMany({
            where: eq(planConfigs.isActive, true),
            orderBy: [planConfigs.sortOrder],
        });
    });
}

// ─── Start Free Trial (REMOVED) ─────────────────────────────────────────────
// The free trial system has been removed in favor of a paid-first onboarding model.
// Kitchens are now created as INACTIVE and activated only upon Stripe payment.

// ─── Get Subscription Status ────────────────────────────────────────────────

export async function getSubscriptionStatus(
    kitchenId: string
): Promise<SubscriptionStatusResult> {
    return cached(
        SubscriptionCacheKeys.status(kitchenId),
        SUBSCRIPTION_CACHE_TTL,
        async () => {
            const kitchen = await db.query.kitchens.findFirst({
                where: eq(kitchens.id, kitchenId),
            });

            if (!kitchen) throw new NotFoundError("Kitchen");

            // Get the most recent subscription
            const subscription = await db.query.subscriptions.findFirst({
                where: eq(subscriptions.kitchenId, kitchenId),
                orderBy: [desc(subscriptions.createdAt)],
                with: { planConfig: true },
            });

            if (!subscription) {
                return {
                    status: "NONE" as const,
                    subscription: null,
                    daysRemaining: 0,
                    gracePeriodEndsAt: null,
                    canAcceptOrders: false,
                };
            }

            const now = new Date();
            const periodEnd = subscription.currentPeriodEnd;
            const daysRemaining = periodEnd
                ? Math.max(
                    0,
                    Math.ceil(
                        (periodEnd.getTime() - now.getTime()) /
                        (1000 * 60 * 60 * 24)
                    )
                )
                : 0;

            // Determine if kitchen can accept orders
            const activeStatuses = ["TRIALING", "ACTIVE", "PAST_DUE"];
            const canAcceptOrders = activeStatuses.includes(subscription.status);

            return {
                status: subscription.status as SubscriptionStatusResult["status"],
                subscription,
                daysRemaining,
                gracePeriodEndsAt: subscription.gracePeriodEndsAt,
                canAcceptOrders,
            };
        }
    );
}

// ─── Create Checkout Session ────────────────────────────────────────────────
// MIGRATION: Now queries plan_configs for Stripe price IDs instead of premium_plans.
// The planType→planId mapping defaults to "starter" for the legacy checkout flow
// since the old system had a single plan with multiple billing periods.
// The new checkout flow (/api/seller/subscription/checkout) already uses planConfigs directly.

export async function createSubscriptionCheckout(
    userId: string,
    kitchenId: string,
    planType: SubscriptionPlanType,
    paymentMethod: string
) {
    // Validate the plan
    const planConfig = SUBSCRIPTION_PLANS[planType];
    if (!planConfig) throw new NotFoundError("Subscription plan");

    // Non-Stripe gateways: throw proper 501 Not Implemented error
    if (paymentMethod !== "STRIPE") {
        logger.info("Non-Stripe payment method requested", {
            paymentMethod,
            kitchenId,
            planType,
        });
        const error = new Error(`${paymentMethod} payments are not yet available. Please use Stripe or contact support.`);
        (error as any).statusCode = 501;
        (error as any).code = 'NOT_IMPLEMENTED';
        throw error;
    }

    // MIGRATION: Query plan_configs instead of premium_plans.
    // The legacy checkout flow defaults to "starter" plan tier.
    const plan = await db.query.planConfigs.findFirst({
        where: and(
            eq(planConfigs.planId, "starter"),
            eq(planConfigs.isActive, true)
        ),
    });

    if (!plan) throw new NotFoundError("Plan configuration");

    // MIGRATION: plan_configs has a single stripePriceId per row.
    // The legacy multi-price mapping (monthly/quarterly/yearly) is no longer needed.
    const stripePriceId = plan.stripePriceId;

    // If no Stripe price ID configured, create a one-time checkout
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

    if (!stripePriceId) {
        // Fallback: create a one-time payment session with the plan amount
        const session = await stripe.checkout.sessions.create({
            mode: "payment",
            line_items: [
                {
                    price_data: {
                        currency: "pkr",
                        product_data: {
                            name: `Smart Tiffin ${planConfig.label} Plan`,
                            description: planConfig.description,
                        },
                        unit_amount: planConfig.price,
                    },
                    quantity: 1,
                },
            ],
            success_url: `${baseUrl}/dashboard/subscription?status=success&plan=${planType}`,
            cancel_url: `${baseUrl}/dashboard/subscription?status=cancelled`,
            metadata: {
                userId,
                kitchenId,
                planId: plan.planId,
                planType,
            },
        });

        logger.info("Stripe checkout session created (one-time)", {
            sessionId: session.id,
            kitchenId,
            planType,
            amount: planConfig.price,
        });

        return { url: session.url, paymentMethod: "STRIPE", status: "REDIRECT" as const };
    }

    // Standard subscription checkout
    const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [{ price: stripePriceId, quantity: 1 }],
        success_url: `${baseUrl}/dashboard/subscription?status=success&plan=${planType}`,
        cancel_url: `${baseUrl}/dashboard/subscription?status=cancelled`,
        metadata: {
            userId,
            kitchenId,
            planId: plan.planId,
            planType,
        },
    });

    logger.info("Stripe checkout session created (subscription)", {
        sessionId: session.id,
        kitchenId,
        planType,
    });

    return { url: session.url, paymentMethod: "STRIPE", status: "REDIRECT" as const };
}

// ─── Cancel Subscription ────────────────────────────────────────────────────

export async function cancelSubscription(
    subscriptionId: string,
    userId: string,
    reason?: string
) {
    const subscription = await db.query.subscriptions.findFirst({
        where: and(
            eq(subscriptions.id, subscriptionId),
            eq(subscriptions.userId, userId)
        ),
    });

    if (!subscription) throw new NotFoundError("Subscription");

    if (
        subscription.status === "CANCELLED" ||
        subscription.status === "EXPIRED"
    ) {
        throw new ConflictError("Subscription is already cancelled or expired");
    }

    // Cancel on Stripe if applicable
    if (subscription.stripeSubscriptionId) {
        try {
            await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
                cancel_at_period_end: true,
            });
        } catch (err) {
            logger.error("Failed to cancel Stripe subscription", {
                stripeSubscriptionId: subscription.stripeSubscriptionId,
                error: err instanceof Error ? err.message : "Unknown error",
            });
            // Continue with local cancellation even if Stripe fails
        }
    }

    const now = new Date();
    await db
        .update(subscriptions)
        .set({
            autoRenew: false,
            cancelledAt: now,
            cancelReason: reason || null,
            updatedAt: now,
        })
        .where(eq(subscriptions.id, subscriptionId));

    await invalidateCache(
        SubscriptionCacheKeys.status(subscription.kitchenId)
    );

    logger.info("Subscription cancelled", {
        subscriptionId,
        userId,
        kitchenId: subscription.kitchenId,
        reason,
    });

    return { success: true, cancelledAt: now };
}

// ─── Handle Stripe Webhook Events ──────────────────────────────────────────

export async function handleStripeEvent(event: Stripe.Event) {
    logger.info("Processing Stripe event", {
        type: event.type,
        eventId: event.id,
    });

    switch (event.type) {
        case "checkout.session.completed": {
            const session = event.data.object as Stripe.Checkout.Session;
            const metadata = session.metadata || {};

            // Handle BOOST explicitly
            if (metadata.type === "BOOST") {
                const { kitchenId, userId, durationDays } = metadata;
                if (!kitchenId || !userId || !durationDays) {
                    logger.error("Missing metadata for BOOST checkout", { sessionId: session.id });
                    return;
                }
                logger.info("Processing BOOST checkout", { kitchenId, durationDays });
                await activateBoost(kitchenId, userId, parseInt(durationDays, 10), 10);
                
                // Invalidate city search cache (we don't have city slug readily available but we invalidate profile)
                await invalidateCache(SubscriptionCacheKeys.status(kitchenId));
                const k = await db.query.kitchens.findFirst({ where: eq(kitchens.id, kitchenId) });
                if (k?.citySlug) await invalidateCache(`kitchens:city:${k.citySlug}`);
                return;
            }

            const { userId, kitchenId, planId, planType } = metadata;

            if (!userId || !kitchenId || !planId) {
                logger.error(
                    "Missing metadata in checkout.session.completed",
                    { sessionId: session.id }
                );
                return;
            }

            // Idempotency: check if subscription already created
            if (session.subscription) {
                const existing = await db.query.subscriptions.findFirst({
                    where: eq(
                        subscriptions.stripeSubscriptionId,
                        session.subscription as string
                    ),
                });
                if (existing) {
                    logger.warn("Duplicate checkout webhook — subscription exists", {
                        stripeSubscriptionId: session.subscription,
                    });
                    return;
                }
            }

            const now = new Date();
            const planConfigConst =
                SUBSCRIPTION_PLANS[
                (planType as SubscriptionPlanType) || "BASE_MONTHLY"
                ];
            const periodEnd = new Date(
                now.getTime() + planConfigConst.durationDays * 24 * 60 * 60 * 1000
            );

            await db.insert(subscriptions).values({
                userId,
                kitchenId,
                planId: planId as "starter" | "growth" | "pro" | "elite",
                planType: (planType as SubscriptionPlanType) || "BASE_MONTHLY",
                stripeSubscriptionId: (session.subscription as string) || null,
                stripeCustomerId: (session.customer as string) || null,
                paymentMethod: "STRIPE",
                status: "ACTIVE",
                currentPeriodStart: now,
                currentPeriodEnd: periodEnd,
                autoRenew: session.mode === "subscription",
            });

            // Activate kitchen
            await db
                .update(kitchens)
                .set({ status: "ACTIVE", updatedAt: now })
                .where(eq(kitchens.id, kitchenId));

            // MIGRATION: Query plan_configs instead of premium_plans for boost/badge.
            // planId in metadata is now the enum value (starter/growth/pro/elite).
            const plan = await db.query.planConfigs.findFirst({
                where: eq(planConfigs.planId, planId as "starter" | "growth" | "pro" | "elite"),
            });

            // MIGRATION: premium_plans.includesBoost → planConfigs.featuredBoostLevel != 'none'
            if (plan?.featuredBoostLevel && plan.featuredBoostLevel !== 'none') {
                // Default boost duration of 30 days (was plan.boostDurationDays in old schema)
                await activateBoost(
                    kitchenId,
                    userId,
                    30
                );
            }

            // MIGRATION: premium_plans.includesVerifiedBadge → planConfigs.brandingLevel != 'none'
            if (plan?.brandingLevel && plan.brandingLevel !== 'none') {
                await db
                    .update(kitchens)
                    .set({ isVerified: true, updatedAt: now })
                    .where(eq(kitchens.id, kitchenId));
            }

            await invalidateCache(SubscriptionCacheKeys.status(kitchenId));

            logger.info("Subscription activated via checkout", {
                kitchenId,
                planType,
                periodEnd: periodEnd.toISOString(),
            });
            break;
        }

        case "customer.subscription.updated": {
            const subscription = event.data.object as Stripe.Subscription;
            const subData = subscription as unknown as Record<
                string,
                unknown
            >;
            const periodStart = subData.current_period_start as
                | number
                | undefined;
            const periodEnd = subData.current_period_end as
                | number
                | undefined;

            const statusMap: Record<string, string> = {
                active: "ACTIVE",
                past_due: "PAST_DUE",
                trialing: "TRIALING",
                canceled: "CANCELLED",
                unpaid: "SUSPENDED",
            };

            const mappedStatus =
                statusMap[subscription.status] || "PAST_DUE";

            await db
                .update(subscriptions)
                .set({
                    status: mappedStatus as "ACTIVE" | "PAST_DUE" | "TRIALING" | "CANCELLED" | "SUSPENDED",
                    currentPeriodStart: periodStart
                        ? new Date(periodStart * 1000)
                        : new Date(),
                    currentPeriodEnd: periodEnd
                        ? new Date(periodEnd * 1000)
                        : new Date(
                            Date.now() + 30 * 24 * 60 * 60 * 1000
                        ),
                    updatedAt: new Date(),
                })
                .where(
                    eq(
                        subscriptions.stripeSubscriptionId,
                        subscription.id
                    )
                );

            logger.info("Subscription updated via webhook", {
                stripeSubscriptionId: subscription.id,
                newStatus: mappedStatus,
            });
            break;
        }

        case "customer.subscription.deleted": {
            const subscription = event.data.object as Stripe.Subscription;
            await db
                .update(subscriptions)
                .set({
                    status: "CANCELLED",
                    cancelledAt: new Date(),
                    updatedAt: new Date(),
                })
                .where(
                    eq(
                        subscriptions.stripeSubscriptionId,
                        subscription.id
                    )
                );

            logger.info("Subscription deleted via webhook", {
                stripeSubscriptionId: subscription.id,
            });
            break;
        }

        case "invoice.payment_failed": {
            const invoice = event.data.object as Stripe.Invoice;
            const stripeSubId = (invoice as unknown as Record<string, unknown>).subscription as string | null;
            if (!stripeSubId) return;

            const now = new Date();
            const gracePeriodEndsAt = new Date(
                now.getTime() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000
            );

            await db
                .update(subscriptions)
                .set({
                    status: "PAST_DUE",
                    gracePeriodEndsAt,
                    updatedAt: now,
                })
                .where(
                    eq(subscriptions.stripeSubscriptionId, stripeSubId)
                );

            logger.warn("Invoice payment failed — grace period started", {
                stripeSubscriptionId: stripeSubId,
                gracePeriodEndsAt: gracePeriodEndsAt.toISOString(),
            });
            break;
        }

        case "invoice.paid": {
            const invoice = event.data.object as Stripe.Invoice;
            const stripeSubId = (invoice as unknown as Record<string, unknown>).subscription as string | null;
            if (!stripeSubId) return;

            await db
                .update(subscriptions)
                .set({
                    status: "ACTIVE",
                    gracePeriodEndsAt: null,
                    updatedAt: new Date(),
                })
                .where(
                    eq(subscriptions.stripeSubscriptionId, stripeSubId)
                );

            logger.info("Invoice paid — subscription reactivated", {
                stripeSubscriptionId: stripeSubId,
            });
            break;
        }

        default:
            logger.debug("Unhandled Stripe event type", {
                type: event.type,
            });
    }
}

// ─── Activate Boost ─────────────────────────────────────────────────────────

export async function activateBoost(
    kitchenId: string,
    userId: string,
    durationDays: number,
    priority = 1
) {
    const expiresAt = new Date(
        Date.now() + durationDays * 24 * 60 * 60 * 1000
    );

    await db.insert(boosts).values({
        kitchenId,
        userId,
        priority,
        expiresAt,
        status: "ACTIVE",
    });

    await db
        .update(kitchens)
        .set({
            boostPriority: priority,
            boostExpiresAt: expiresAt,
            updatedAt: new Date(),
        })
        .where(eq(kitchens.id, kitchenId));

    logger.info("Boost activated", {
        kitchenId,
        durationDays,
        expiresAt: expiresAt.toISOString(),
    });
}

// ─── Check and Enforce Grace Period ─────────────────────────────────────────

/**
 * Called by a cron job or on-demand: if a subscription's grace period has
 * expired, suspend the kitchen.
 */
export async function checkGracePeriod(kitchenId: string) {
    const sub = await db.query.subscriptions.findFirst({
        where: and(
            eq(subscriptions.kitchenId, kitchenId),
            eq(subscriptions.status, "PAST_DUE")
        ),
    });

    if (!sub || !sub.gracePeriodEndsAt) return;

    const now = new Date();
    if (now > sub.gracePeriodEndsAt) {
        await db
            .update(subscriptions)
            .set({ status: "SUSPENDED", updatedAt: now })
            .where(eq(subscriptions.id, sub.id));

        await db
            .update(kitchens)
            .set({ status: "SUSPENDED", updatedAt: now })
            .where(eq(kitchens.id, kitchenId));

        await invalidateCache(SubscriptionCacheKeys.status(kitchenId));

        logger.warn("Kitchen suspended — grace period expired", {
            kitchenId,
            subscriptionId: sub.id,
        });
    }
}
