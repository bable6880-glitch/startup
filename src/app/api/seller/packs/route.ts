import { NextRequest, NextResponse } from "next/server";
import { requireSeller } from "@/lib/auth/seller-guard";
import { db } from "@/lib/db";
import { subscriptions, extraPacks } from "@/lib/db/schema";
import { eq, and, inArray, gt } from "drizzle-orm";
import { stripe } from "@/lib/stripe";
import { ORDER_PACKS, POTLUCK_PACKS } from "@/config/pack-pricing";
import { logger } from "@/lib/utils/logger";
import { z } from "zod";

const packPurchaseSchema = z.object({
    packType: z.enum(["ORDER_PACK", "POTLUCK_PACK"]),
    packSize: z.number().int().positive(),
});

/**
 * GET /api/seller/packs
 * Returns available pack options and current extra limits.
 */
export async function GET(request: NextRequest) {
    try {
        const guard = await requireSeller(request);
        if (!guard.ok) return guard.response;

        const activeSub = await db.query.subscriptions.findFirst({
            where: and(
                eq(subscriptions.kitchenId, guard.kitchen.id),
                inArray(subscriptions.status, ['ACTIVE', 'TRIALING']),
                gt(subscriptions.currentPeriodEnd, new Date()),
            ),
        });

        if (!activeSub) {
            return NextResponse.json({
                error: "You need an active subscription to purchase extra packs.",
            }, { status: 403 });
        }

        return NextResponse.json({
            success: true,
            orderPacks: ORDER_PACKS.map(p => ({
                ...p,
                available: !!p.stripePriceId,
            })),
            potluckPacks: POTLUCK_PACKS.map(p => ({
                ...p,
                available: !!p.stripePriceId,
            })),
            currentExtras: {
                extraOrdersLimit: (activeSub as any).extraOrdersLimit ?? 0,
                extraPotluckUses: (activeSub as any).extraPotluckUses ?? 0,
            },
        });
    } catch (error) {
        logger.error("Failed to fetch pack options", { error });
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/**
 * POST /api/seller/packs
 * Purchase an extra pack (one-time Stripe checkout).
 */
export async function POST(request: NextRequest) {
    try {
        const guard = await requireSeller(request);
        if (!guard.ok) return guard.response;
        const { user, kitchen } = guard;

        const body = await request.json();
        const parsed = packPurchaseSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: "Invalid pack type or size" }, { status: 400 });
        }

        const { packType, packSize } = parsed.data;

        // Must have an active subscription
        const activeSub = await db.query.subscriptions.findFirst({
            where: and(
                eq(subscriptions.kitchenId, kitchen.id),
                inArray(subscriptions.status, ['ACTIVE', 'TRIALING']),
                gt(subscriptions.currentPeriodEnd, new Date()),
            ),
        });

        if (!activeSub) {
            return NextResponse.json({
                error: "You need an active subscription to purchase extra packs.",
            }, { status: 403 });
        }

        // Find the pack config
        const packs = packType === 'ORDER_PACK' ? ORDER_PACKS : POTLUCK_PACKS;
        const packConfig = packs.find((p: { size: number }) => p.size === packSize);

        if (!packConfig) {
            return NextResponse.json({ error: "Invalid pack size" }, { status: 400 });
        }

        if (!packConfig.stripePriceId) {
            return NextResponse.json({ error: "This pack is not yet available for purchase" }, { status: 400 });
        }

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

        // Create Stripe checkout session
        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            line_items: [{ price: packConfig.stripePriceId, quantity: 1 }],
            success_url: `${baseUrl}/dashboard?pack_purchased=true`,
            cancel_url: `${baseUrl}/dashboard/subscription?pack_cancelled=true`,
            metadata: {
                type: 'EXTRA_PACK',
                kitchenId: kitchen.id,
                cookId: user.id,
                subscriptionId: activeSub.id,
                packType,
                packSize: packSize.toString(),
                priceRs: packConfig.priceRs.toString(),
            },
            customer_email: user.email || undefined,
        });

        // Create a PENDING pack record
        await db.insert(extraPacks).values({
            kitchenId: kitchen.id,
            cookId: user.id,
            subscriptionId: activeSub.id,
            packType: packType as any,
            packSize,
            priceRs: packConfig.priceRs,
            status: 'PENDING',
            stripeSessionId: session.id,
        });

        return NextResponse.json({
            success: true,
            data: { url: session.url },
        });
    } catch (error) {
        logger.error("Pack purchase failed", { error });
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
