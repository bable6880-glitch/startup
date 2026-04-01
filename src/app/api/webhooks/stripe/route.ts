import { NextRequest, NextResponse } from "next/server";
import { handleStripeEvent } from "@/services/premium.service";
import { stripe } from "@/lib/stripe";
import type Stripe from "stripe";
import { redis } from "@/lib/redis/index";

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
            await handleStripeEvent(event);
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
