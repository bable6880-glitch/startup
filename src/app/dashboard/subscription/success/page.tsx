import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import { subscriptions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { SuccessUI } from './success-ui';

export default async function SubscriptionSuccess({
    searchParams
}: {
    searchParams: { session_id?: string }
}) {
    // Next.js 15 requires awaiting searchParams
    const sp = await Promise.resolve(searchParams);
    const sessionId = sp.session_id;

    // No session_id → redirect away immediately
    if (!sessionId) {
        redirect('/dashboard/subscription');
    }

    try {
        // Verify session exists in Stripe
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        // Session must be paid/complete
        if (session.payment_status !== 'paid' && session.status !== 'complete') {
            redirect('/dashboard/subscription?error=payment_failed');
        }

        // Verify session metadata matches a real kitchen
        const kitchenId = session.metadata?.kitchenId;
        const planId = session.metadata?.planId;
        
        if (!kitchenId || !planId) {
            redirect('/dashboard/subscription?error=invalid_session');
        }

        // Get the now-active subscription from DB
        let subscription = await db.query.subscriptions.findFirst({
            where: and(
                eq(subscriptions.kitchenId, kitchenId),
                eq(subscriptions.status, 'ACTIVE')
            ),
            with: { planConfig: true }
        });

        // ── Phase 6: Synchronous Activation Fallback ─────────────────────
        // If no active subscription exists yet (webhook hasn't arrived/processed),
        // or the active subscription doesn't match the plan we just bought,
        // synchronously trigger the checkout handler to update the DB immediately.
        // The webhook handler's idempotency protection (Phase 1) ensures this is
        // safe even if the webhook arrives later — it will see the event as already
        // processed and skip gracefully.
        const isStale = !subscription || subscription.planId !== planId;

        if (isStale && session.metadata?.type === 'SUBSCRIPTION') {
            try {
                console.log(`[Success Fallback] Synchronously activating subscription for kitchen ${kitchenId}, plan ${planId}`);
                const { handleSubscriptionCheckout } = await import("@/app/api/webhooks/stripe/route");

                // Run the checkout handler inside a transaction
                await db.transaction(async (tx) => {
                    await handleSubscriptionCheckout(tx, session);
                });

                // Re-query to get the freshly-inserted subscription with planConfig
                subscription = await db.query.subscriptions.findFirst({
                    where: and(
                        eq(subscriptions.kitchenId, kitchenId),
                        eq(subscriptions.status, 'ACTIVE')
                    ),
                    with: { planConfig: true }
                });

                console.log(`[Success Fallback] Subscription activated successfully for kitchen ${kitchenId}`);
            } catch (fallbackErr) {
                // Log but don't crash — the webhook will handle it eventually
                console.error("[Success Fallback] Sync activation failed (webhook will retry):", fallbackErr);
            }
        }

        const planName = subscription?.planConfig?.displayName ?? planId;

        // Render success UI with real plan name
        return <SuccessUI planName={planName} planId={subscription?.planConfig?.planId ?? planId ?? undefined} redirectUrl="/dashboard" />;
        
    } catch (err) {
        // Stripe session not found or API error
        console.error("Subscription success verification failed:", err);
        redirect('/dashboard/subscription?error=session_not_found');
    }
}
