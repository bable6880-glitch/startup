import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { kitchens, users, meals } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET /api/stats — public, no auth required
export async function GET() {
    try {
        const [kitchenCount] = await db
            .select({ count: db.$count(kitchens, eq(kitchens.status, "ACTIVE")) })
            .from(kitchens);

        const [mealCount] = await db
            .select({ count: db.$count(meals, eq(meals.isAvailable, true)) })
            .from(meals);

        const [userCount] = await db
            .select({ count: db.$count(users, eq(users.isActive, true)) })
            .from(users);

        return NextResponse.json(
            {
                success: true,
                data: {
                    kitchens: Number(kitchenCount.count),
                    meals: Number(mealCount.count),
                    customers: Number(userCount.count),
                },
            },
            {
                status: 200,
                headers: {
                    "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
                },
            }
        );
    } catch (err) {
        console.error("[GET /api/stats]", err);
        return NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Failed to fetch stats" } },
            { status: 500 }
        );
    }
}
