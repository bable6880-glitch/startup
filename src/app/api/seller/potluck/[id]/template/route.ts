import { NextRequest, NextResponse } from "next/server";
import { requireSeller } from "@/lib/auth/seller-guard";
import { db } from "@/lib/db";
import { potluckDeals, meals } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { logger } from "@/lib/utils/logger";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const guard = await requireSeller(req);
        if (!guard.ok) return guard.response;
        const { kitchen, user } = guard;

        const { id } = await params;
        const sourceDealId = id;
        
        // Find the source deal
        const sourceDeal = await db.query.potluckDeals.findFirst({
            where: and(
                eq(potluckDeals.id, sourceDealId),
                eq(potluckDeals.kitchenId, kitchen.id)
            )
        });

        if (!sourceDeal) {
            return NextResponse.json({ error: "Source deal not found" }, { status: 404 });
        }

        // Create hidden meal for the template
        const [newMeal] = await db.insert(meals).values({
            kitchenId: kitchen.id,
            name: `[Potluck] [Template] ${sourceDeal.title}`,
            description: sourceDeal.description,
            price: Number(sourceDeal.pricePerPlateRs),
            currency: "PKR",
            imageUrl: sourceDeal.imageUrl,
            isAvailable: false,
            category: "Potluck Special",
        }).returning({ id: meals.id });

        // Duplicate the deal into DRAFT status
        const [templateDeal] = await db.insert(potluckDeals).values({
            kitchenId: kitchen.id,
            cookId: user.id,
            subscriptionId: sourceDeal.subscriptionId,
            title: `[Template] ${sourceDeal.title}`,
            description: sourceDeal.description,
            mealId: newMeal.id,
            totalPlatesAvailable: sourceDeal.totalPlatesAvailable,
            targetOrderCount: sourceDeal.targetOrderCount,
            pricePerPlateRs: sourceDeal.pricePerPlateRs,
            regularPriceRs: sourceDeal.regularPriceRs,
            status: 'DRAFT',
            imageUrl: sourceDeal.imageUrl,
            city: sourceDeal.city,
            citySlug: sourceDeal.citySlug,
            // Keep expiresAt in the future so it doesn't immediately show up as expired
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        }).returning();

        return NextResponse.json({ success: true, deal: templateDeal });
    } catch (error) {
        logger.error("Failed to save potluck template", { error });
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
