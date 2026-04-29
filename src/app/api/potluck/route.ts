import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { potluckDeals, kitchens } from "@/lib/db/schema";
import { eq, and, gt, desc } from "drizzle-orm";
import { logger } from "@/lib/utils/logger";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const citySlug = searchParams.get("city");
        
        let condition = and(
            eq(potluckDeals.status, 'ACTIVE'),
            gt(potluckDeals.expiresAt, new Date())
        );

        if (citySlug) {
            condition = and(condition, eq(potluckDeals.citySlug, citySlug));
        }

        const deals = await db.query.potluckDeals.findMany({
            where: condition,
            orderBy: [desc(potluckDeals.createdAt)],
            with: {
                kitchen: {
                    columns: {
                        name: true,
                        city: true,
                        avatarUrl: true,
                        rating: true,
                        reviewCount: true,
                    }
                }
            }
        });

        return NextResponse.json({ success: true, deals });
    } catch (error) {
        logger.error("Failed to fetch public potlucks", { error });
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
