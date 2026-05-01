import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { potluckDeals, kitchens } from "@/lib/db/schema";
import { eq, and, gt, desc } from "drizzle-orm";
import { logger } from "@/lib/utils/logger";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const citySlug = searchParams.get("city");
        const limitParam = Math.min(10, Math.max(1, parseInt(searchParams.get("limit") ?? "10")));

        let condition = and(
            eq(potluckDeals.status, 'ACTIVE'),
            gt(potluckDeals.expiresAt, new Date())
        );

        if (citySlug) {
            condition = and(condition, eq(potluckDeals.citySlug, citySlug));
        }

        // Direct query since potluckDeals relation to kitchen may not exist
        const deals = await db
            .select({
                id: potluckDeals.id,
                title: potluckDeals.title,
                description: potluckDeals.description,
                totalPlatesAvailable: potluckDeals.totalPlatesAvailable,
                targetOrderCount: potluckDeals.targetOrderCount,
                pricePerPlateRs: potluckDeals.pricePerPlateRs,
                regularPriceRs: potluckDeals.regularPriceRs,
                currentOrderCount: potluckDeals.currentOrderCount,
                status: potluckDeals.status,
                expiresAt: potluckDeals.expiresAt,
                imageUrl: potluckDeals.imageUrl,
                city: potluckDeals.city,
                createdAt: potluckDeals.createdAt,
                kitchenName: kitchens.name,
                kitchenCity: kitchens.city,
                kitchenImage: kitchens.profileImageUrl,
                kitchenRating: kitchens.avgRating,
                kitchenReviewCount: kitchens.reviewCount,
            })
            .from(potluckDeals)
            .innerJoin(kitchens, eq(potluckDeals.kitchenId, kitchens.id))
            .where(condition!)
            .orderBy(desc(potluckDeals.createdAt))
            .limit(limitParam);

        return NextResponse.json({ success: true, deals });
    } catch (error) {
        logger.error("Failed to fetch public potlucks", { error });
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
