import { NextRequest, NextResponse } from "next/server";
import { requireSeller } from "@/lib/auth/seller-guard";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { stripe } from "@/lib/stripe";
import { logger } from "@/lib/utils/logger";

export async function POST(req: NextRequest) {
    try {
        const guard = await requireSeller(req);
        if (!guard.ok) return guard.response;

        // Find the most recent subscription to get the customer ID
        const sub = await db.query.subscriptions.findFirst({
            where: eq(subscriptions.kitchenId, guard.kitchen.id),
            orderBy: (subscriptions, { desc }) => [desc(subscriptions.createdAt)],
        });

        if (!sub || !sub.stripeCustomerId) {
            return NextResponse.json({ error: "No billing profile found" }, { status: 404 });
        }

        const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

        const session = await stripe.billingPortal.sessions.create({
            customer: sub.stripeCustomerId,
            return_url: `${origin}/dashboard/subscription`,
        });

        return NextResponse.json({ url: session.url });
    } catch (error) {
        logger.error("Failed to create Stripe portal session", { error });
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
