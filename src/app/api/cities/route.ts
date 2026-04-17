import { db } from "@/lib/db"
import { kitchens } from "@/lib/db/schema"
import { eq, isNull, sql } from "drizzle-orm"
import { apiSuccess } from "@/lib/utils/api-response"
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
