import { NextRequest } from "next/server";
import { requireSeller } from "@/lib/auth/seller-guard";
import { db } from "@/lib/db";
import { boosts } from "@/lib/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { apiSuccess, apiBadRequest, apiInternalError } from "@/lib/utils/api-response";
import { logger } from "@/lib/utils/logger";
import { z } from "zod";
import { stripe } from "@/lib/stripe";

const boostSchema = z.object({
    durationDays: z.union([z.literal(7), z.literal(14), z.literal(30)])
});

export async function POST(request: NextRequest) {
    try {
        const guard = await requireSeller(request);
        if (!guard.ok) return guard.response;
        const { user, kitchen } = guard;

        const body = await request.json();
        const parsed = boostSchema.safeParse(body);
        
        if (!parsed.success) {
            return apiBadRequest("Invalid boost duration", parsed.error.flatten().fieldErrors);
        }

        const { durationDays } = parsed.data;

        // Check if kitchen already has an active boost
        const existingBoost = await db.query.boosts.findFirst({
            where: and(
                eq(boosts.kitchenId, kitchen.id),
                eq(boosts.status, "ACTIVE"),
                gt(boosts.expiresAt, new Date())
            )
        });

        if (existingBoost || (kitchen.status === 'ACTIVE' && kitchen.boostExpiresAt && kitchen.boostExpiresAt > new Date())) {
            return Response.json({ success: false, error: { message: "Kitchen already has an active boost." } }, { status: 409 });
        }

        const prices = {
            7: 500,
            14: 900,
            30: 1800
        };
        const pricePkr = prices[durationDays as keyof typeof prices];

        // Create Stripe checkout session
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
        
        const session = await stripe.checkout.sessions.create({
            mode: "payment",
            line_items: [
                {
                    price_data: {
                        currency: "pkr",
                        product_data: {
                            name: `Kitchen Boost - ${durationDays} Days`,
                            description: `Boost priority listing for ${durationDays} days.`,
                        },
                        unit_amount: pricePkr * 100, // Stripe expects cents/paisa
                    },
                    quantity: 1,
                },
            ],
            success_url: `${baseUrl}/dashboard/boost?status=success`,
            cancel_url: `${baseUrl}/dashboard/boost?status=cancelled`,
            metadata: {
                type: "BOOST",
                kitchenId: kitchen.id,
                userId: user.id,
                durationDays: durationDays.toString()
            },
        });

        return apiSuccess({ checkoutUrl: session.url });
    } catch (error) {
        logger.error("Boost checkout creation failed", { error: error instanceof Error ? error.message : "Unknown error" });
        return apiInternalError("Failed to create boost checkout session");
    }
}
