import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cities, kitchens } from "@/lib/db/schema";
import { sql, eq } from "drizzle-orm";
import { apiSuccess, apiInternalError } from "@/lib/utils/api-response";
import { redis } from "@/lib/redis";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        // Fetch all cities from the cities table
        const allCities = await db.query.cities.findMany({
            orderBy: (cities, { asc }) => [asc(cities.name)]
        });

        const cityNames = allCities.map(c => c.name);

        // We also want to include any cities that might be in kitchens but not in cities table (legacy)
        const legacyRows = await db
            .select({ city: kitchens.city })
            .from(kitchens)
            .where(sql`${kitchens.city} IS NOT NULL AND ${kitchens.city} != ''`)
            .groupBy(kitchens.city);

        const legacyCities = legacyRows.map(r => r.city).filter(Boolean);

        // Combine and deduplicate, preferring proper title case from cities table if there are differences
        const uniqueCityNames = Array.from(new Set([...cityNames, ...legacyCities]));
        uniqueCityNames.sort((a, b) => (a ?? "").localeCompare(b ?? ""));

        return apiSuccess(uniqueCityNames);
    } catch (error) {
        console.error("[Fetch Available Cities Error]", error);
        return apiInternalError("Failed to fetch available cities");
    }
}
