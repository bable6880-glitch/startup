import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { kitchens, users, meals, orders, reviews, platformReviews } from "@/lib/db/schema";
import { eq, sql, and, isNull } from "drizzle-orm";

// GET /api/stats — public, no auth required
export async function GET() {
    try {
        // Run all queries in parallel for speed
        const [
            kitchenCountResult,
            mealCountResult,
            userCountResult,
            orderCountResult,
            reviewCountResult,
            cityCountsResult,
        ] = await Promise.all([
            // Active kitchens count
            db
                .select({ count: db.$count(kitchens, and(eq(kitchens.status, "ACTIVE"), isNull(kitchens.deletedAt))) })
                .from(kitchens),

            // Available meals count
            db
                .select({ count: db.$count(meals, eq(meals.isAvailable, true)) })
                .from(meals),

            // Active users count
            db
                .select({ count: db.$count(users, eq(users.isActive, true)) })
                .from(users),

            // Completed orders count
            db
                .select({ count: db.$count(orders, eq(orders.status, "COMPLETED")) })
                .from(orders),

            // Total visible reviews (kitchen reviews + platform reviews)
            Promise.all([
                db.select({ count: db.$count(reviews, eq(reviews.isVisible, true)) }).from(reviews),
                db.select({ count: db.$count(platformReviews, eq(platformReviews.isVisible, true)) }).from(platformReviews),
            ]).then(([kr, pr]) => Number(kr[0].count) + Number(pr[0].count)),

            // Per-city kitchen counts (active kitchens only)
            db
                .select({
                    city: kitchens.city,
                    count: sql<number>`count(*)`.mapWith(Number),
                })
                .from(kitchens)
                .where(
                    sql`${kitchens.status} = 'ACTIVE' AND ${kitchens.deletedAt} IS NULL AND ${kitchens.city} IS NOT NULL AND ${kitchens.city} != ''`
                )
                .groupBy(kitchens.city)
                .orderBy(sql`count(*) DESC`),
        ]);

        // Build cityCounts map: { "Lahore": 5, "Karachi": 3, ... }
        const cityCounts: Record<string, number> = {};
        for (const row of cityCountsResult) {
            if (row.city) {
                cityCounts[row.city] = row.count;
            }
        }

        const distinctCities = Object.keys(cityCounts).length;

        return NextResponse.json(
            {
                success: true,
                data: {
                    kitchens: Number(kitchenCountResult[0].count),
                    meals: Number(mealCountResult[0].count),
                    customers: Number(userCountResult[0].count),
                    orders: Number(orderCountResult[0].count),
                    reviews: reviewCountResult,
                    cities: distinctCities,
                    cityCounts,
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
