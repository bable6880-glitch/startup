import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { kitchens } from "@/lib/db/schema"
import { eq, isNull, sql } from "drizzle-orm"
import { apiSuccess, apiInternalError } from "@/lib/utils/api-response"
import { redis } from "@/lib/redis"

export const dynamic = 'force-dynamic'

export async function GET() {
  // Try cache first
  if (redis) {
    try {
      const cached = await redis.get<string[]>('cities:active')
      if (cached && Array.isArray(cached) && cached.length > 0) {
        return apiSuccess(cached)
      }
    } catch { /* ignore */ }
  }

  // Fetch distinct cities from active kitchens
  const rows = await db
    .select({
      city: kitchens.city,
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(kitchens)
    .where(
      sql`${kitchens.status} = 'ACTIVE' AND ${kitchens.deletedAt} IS NULL AND ${kitchens.city} IS NOT NULL AND ${kitchens.city} != ''`
    )
    .groupBy(kitchens.city)
    .orderBy(sql`count(*) DESC`)

  const cities = rows.map(r => r.city).filter(Boolean)

  // Cache for 5 min
  if (redis && cities.length > 0) {
    try {
      await redis.set('cities:active', JSON.stringify(cities), { ex: 300 })
    } catch { /* ignore */ }
  }

  return apiSuccess(cities)
}

export async function POST(request: NextRequest) {
    try {
        const { getAuthUser } = await import("@/lib/auth/get-auth-user");
        const user = await getAuthUser(request);
        if (!user || (user.role !== "COOK" && user.role !== "ADMIN")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const rawName = body.name?.toString();
        if (!rawName || rawName.trim().length < 2 || rawName.trim().length > 100) {
            return NextResponse.json({ error: "Invalid city name" }, { status: 400 });
        }

        const name = rawName.trim().replace(/\s+/g, ' ');
        // Title case logic
        const formattedName = name.split(' ')
            .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join(' ');
            
        const { slugify } = await import("@/config/constants");
        const slug = slugify(formattedName);

        // Try to insert on conflict do nothing
        const { cities } = await import("@/lib/db/schema");
        const insertResult = await db.insert(cities).values({
            name: formattedName,
            slug,
        }).onConflictDoNothing({ target: cities.slug }).returning();

        let city = insertResult[0];

        if (!city) {
            // It already exists, fetch it
            const existing = await db.query.cities.findFirst({
                where: eq(cities.slug, slug)
            });
            if (existing) {
                city = existing;
            } else {
                return apiInternalError("Failed to resolve city");
            }
        }

        return apiSuccess(city);
    } catch (error) {
        console.error("[Create City Error]", error);
        return apiInternalError("Failed to create city");
    }
}

