import { NextRequest, NextResponse } from "next/server";
import { requireSeller } from "@/lib/auth/seller-guard";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { kitchens, subscriptions } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { forceActivateKitchen } from "@/services/premium.service";

export async function GET(request: NextRequest) {
    try {
        const guard = await requireSeller(request);
        if (!guard.ok) return guard.response;
        const { user, kitchen } = guard;

        const { searchParams } = new URL(request.url);
        const sessionId = searchParams.get("session_id");

        if (!sessionId) {
            return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
        }

        // Retrieve Stripe Checkout Session
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        
        if (session.payment_status !== 'paid') {
            return NextResponse.json({
                isVerified: false,
                redirectTo: "/dashboard/subscription"
            });
        }

        // Query DB for cook's kitchens and subscriptions
        const kitchenRow = await db.query.kitchens.findFirst({
            where: and(eq(kitchens.id, kitchen.id), eq(kitchens.ownerId, user.id)),
        });

        if (!kitchenRow) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const subRow = await db.query.subscriptions.findFirst({
            where: eq(subscriptions.kitchenId, kitchen.id),
            orderBy: [desc(subscriptions.createdAt)],
            with: { planConfig: true },
        });

        // Repair Mode
        if (kitchenRow.status === 'INACTIVE') {
            try {
                await forceActivateKitchen(kitchen.id, session);
                kitchenRow.status = 'ACTIVE';
            } catch (err) {
                console.error("[Verify] Repair failed", err);
                return NextResponse.json({
                    isVerified: false,
                    redirectTo: "/dashboard/subscription?error=activation_failed"
                });
            }
        }

        return NextResponse.json({
            isVerified: true,
            paymentStatus: session.payment_status,
            kitchenStatus: kitchenRow.status,
            plan: { tier: subRow?.planId ?? "Unknown" },
            redirectTo: "/dashboard"
        });

    } catch (err) {
        console.error("[Verify Route Error]", err);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
