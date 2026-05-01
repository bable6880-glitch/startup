import { NextRequest, NextResponse } from "next/server";
import { requireSeller } from "@/lib/auth/seller-guard";
import { db } from "@/lib/db";
import { potluckDeals } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { createPotluckSchema } from "@/lib/validations/potluck";
import { guardFeatureAccess, PlanFeatureError } from "@/lib/plans/plan-guards";
import { getKitchenPlanAccess } from "@/lib/plans/plan-access";
import { logger } from "@/lib/utils/logger";

export async function POST(req: NextRequest) {
    try {
        const guard = await requireSeller(req);
        if (!guard.ok) return guard.response;
        const { user, kitchen } = guard;

        // Verify premium feature access
        try {
            await guardFeatureAccess(kitchen.id, 'potluck');
        } catch (error) {
            if (error instanceof PlanFeatureError) {
                return NextResponse.json({ error: error.message }, { status: 403 });
            }
            throw error;
        }

        const access = await getKitchenPlanAccess(kitchen.id);
        
        if (!access.canCreatePotluck()) {
            return NextResponse.json({ error: "You have exhausted your potluck uses for this billing period. Please upgrade your plan." }, { status: 403 });
        }

        const body = await req.json();
        const parsed = createPotluckSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });
        }

        const data = parsed.data;

        if (!access.subscription) {
             return NextResponse.json({ error: "Active subscription required" }, { status: 403 });
        }

        // Create deal
        const [deal] = await db.insert(potluckDeals).values({
            kitchenId: kitchen.id,
            cookId: user.id,
            subscriptionId: access.subscription.id,
            title: data.title,
            description: data.description || null,
            mealId: data.mealId || null,
            totalPlatesAvailable: data.totalPlatesAvailable,
            targetOrderCount: data.targetOrderCount,
            pricePerPlateRs: data.pricePerPlateRs.toString(),
            regularPriceRs: data.regularPriceRs.toString(),
            status: 'PENDING',
            expiresAt: new Date(data.expiresAt),
            city: kitchen.city || 'Unknown',
            citySlug: kitchen.citySlug || 'unknown',
        }).returning();

        // Decrement potluck uses (atomic — prevents going below 0)
        if (access.planConfig && access.planConfig.potluckUsesPerPeriod !== -1) {
            const { decrementPotluckUses } = await import("@/services/plan-usage.service");
            await decrementPotluckUses(access.subscription!.id);
        }

        logger.info("Potluck deal created", { dealId: deal.id, kitchenId: kitchen.id });

        return NextResponse.json({ success: true, deal });
    } catch (error) {
        logger.error("Failed to create potluck", { error });
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const guard = await requireSeller(req);
        if (!guard.ok) return guard.response;
        const { kitchen } = guard;

        const deals = await db.query.potluckDeals.findMany({
            where: eq(potluckDeals.kitchenId, kitchen.id),
            orderBy: [desc(potluckDeals.createdAt)],
        });

        return NextResponse.json({ success: true, deals });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
