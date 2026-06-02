// src/app/dashboard/subscription/success/page.tsx
// SERVER COMPONENT — runs on server, has access to DB and Stripe

import { redirect } from 'next/navigation';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import { kitchens, subscriptions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { invalidatePlanAccessCache } from '@/lib/plans/plan-access';
import { cookies } from 'next/headers';
import { getAuthUser } from '@/lib/auth/get-auth-user';

interface PageProps {
  searchParams: Promise<{ session_id?: string }>;
}

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function SubscriptionSuccessPage({
  searchParams,
}: PageProps) {
  const sp = await searchParams;
  const sessionId = sp.session_id;

  // ── Guard: session_id must be present ─────────────────────────
  if (!sessionId) {
    redirect('/dashboard/subscription');
  }

  // ── Step 1: Verify Stripe session server-side ──────────────────
  // This prevents anyone from hitting /success?session_id=fake
  let stripeSession;
  try {
    stripeSession = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'payment_intent'],
    });
  } catch (err) {
    console.error('[SubscriptionSuccess] Stripe session retrieval failed:', err);
    redirect('/dashboard/subscription?error=session_invalid');
  }

  // ── Step 2: Confirm payment was actually successful ────────────
  if (
    stripeSession.payment_status !== 'paid' &&
    stripeSession.status !== 'complete'
  ) {
    redirect('/dashboard/subscription?error=payment_incomplete');
  }

  // ── Step 3: Extract metadata set during checkout creation ──────
  const metadata_stripe = stripeSession.metadata;
  const kitchenId = metadata_stripe?.kitchenId;
  const cookId = metadata_stripe?.cookId;
  const planId = metadata_stripe?.planId;

  if (!kitchenId || !cookId || !planId) {
    console.error('[SubscriptionSuccess] Missing metadata in Stripe session', {
      sessionId,
      metadata: metadata_stripe,
    });
    redirect('/dashboard/subscription?error=metadata_missing');
  }

  // ── Step 4: Verify the cook owns this kitchen ──────────────────
  // We read from DB directly here since we have kitchenId + cookId from
  // Stripe metadata (which was set by requireSeller in checkout route)
  const kitchen = await db.query.kitchens.findFirst({
    where: and(
      eq(kitchens.id, kitchenId),
      eq(kitchens.ownerId, cookId),
    ),
    columns: {
      id: true,
      status: true,
      planId: true,
      isLocked: true,
    },
  });

  if (!kitchen) {
    console.error('[SubscriptionSuccess] Kitchen not found or ownership mismatch', {
      kitchenId,
      cookId,
    });
    redirect('/dashboard/subscription?error=unauthorized');
  }

  // ── Step 5: Invalidate Redis plan access cache ─────────────────
  // The webhook should have already done this, but we do it here
  // as a safety net for race conditions where we load this page
  // before the webhook fires.
  try {
    await invalidatePlanAccessCache(kitchenId);
  } catch (err) {
    // Non-fatal: cache miss means fresh DB read, which is fine
    console.warn('[SubscriptionSuccess] Cache invalidation failed (non-fatal):', err);
  }

  // ── Step 6: Check if webhook has already activated the kitchen ─
  // The webhook fires asynchronously. On fast connections the
  // success page may load before the webhook completes.
  // We poll the DB up to 5 times (5 seconds total) for ACTIVE status.
  // If still INACTIVE after 5s, we redirect anyway — the dashboard's
  // SubscriptionGuard will show a "pending activation" message.

  let isActive = kitchen.status === 'ACTIVE';

  if (!isActive) {
    for (let attempt = 0; attempt < 5; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const refreshed = await db.query.kitchens.findFirst({
        where: eq(kitchens.id, kitchenId),
        columns: { status: true },
      });

      if (refreshed?.status === 'ACTIVE') {
        isActive = true;
        // Invalidate cache again now that kitchen is confirmed ACTIVE
        try {
          await invalidatePlanAccessCache(kitchenId);
        } catch {
          // Non-fatal
        }
        break;
      }
    }
  }

  // ── Step 7: Redirect to dashboard ─────────────────────────────
  // Whether or not the webhook has fired, redirect to dashboard.
  // If kitchen is still INACTIVE, SubscriptionGuard will show a
  // "payment received, activating your kitchen..." message.
  // This is better UX than making the cook wait on this page.
  //
  // Pass a query param so the dashboard can show a success toast.
  redirect('/dashboard?subscribed=true&plan=' + encodeURIComponent(planId));
}
