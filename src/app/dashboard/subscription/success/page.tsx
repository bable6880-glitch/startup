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
    // Next.js 15 requires awaiting searchParams, but if this is an older Next.js version (like 14), we use searchParams directly.
    // We'll safely handle both using standard Next.js conventions.
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
        const subscription = await db.query.subscriptions.findFirst({
            where: and(
                eq(subscriptions.kitchenId, kitchenId),
                eq(subscriptions.status, 'ACTIVE')
            ),
            with: { planConfig: true }
        });

        const planName = subscription?.planConfig?.displayName ?? planId;

        // Render success UI with real plan name
        return <SuccessUI planName={planName} planId={subscription?.planConfig?.planId ?? planId ?? undefined} redirectUrl="/dashboard" />;
        
    } catch (err) {
        // Stripe session not found or API error
        console.error("Subscription success verification failed:", err);
        redirect('/dashboard/subscription?error=session_not_found');
    }
}
