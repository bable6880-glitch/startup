import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { planConfigs } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { logger } from "@/lib/utils/logger";

export async function GET() {
    try {
        const plans = await db.query.planConfigs.findMany({
            where: eq(planConfigs.isActive, true),
            orderBy: [asc(planConfigs.priceRs)],
        });

        return NextResponse.json({ success: true, plans });
    } catch (error) {
        logger.error("Failed to fetch plans", { error });
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
