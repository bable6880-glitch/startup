import { db } from "@/lib/db"
import { meals, kitchens } from "@/lib/db/schema"
import { eq, and, isNull } from "drizzle-orm"
import { redis } from "./index"

export interface MealSearchItem {
  id: string
  name: string
  kitchenId: string
  kitchenName: string
  kitchenCity: string
  kitchenCitySlug: string
  lat: number | null
  lng: number | null
  price: number
  category: string
  isAvailable: boolean
}

export async function getMealSearchIndex(): Promise<MealSearchItem[]> {
  if (!redis) return fetchMealIndexFromDb()
  
  try {
    const cached = await redis.get<MealSearchItem[]>('search:meals:index')
    if (cached && Array.isArray(cached) && cached.length > 0) {
      return cached
    }
  } catch { /* fall through */ }
  
  const fresh = await fetchMealIndexFromDb()
  
  try {
    if (redis) {
      await redis.set('search:meals:index', JSON.stringify(fresh), { ex: 300 })
    }
  } catch { /* ignore */ }
  
  return fresh
}

async function fetchMealIndexFromDb(): Promise<MealSearchItem[]> {
  const data = await db
    .select({
      id: meals.id,
      name: meals.name,
      kitchenId: meals.kitchenId,
      kitchenName: kitchens.name,
      kitchenCity: kitchens.city,
      kitchenCitySlug: kitchens.citySlug,
      latitude: kitchens.latitude,
      longitude: kitchens.longitude,
      price: meals.price,
      category: meals.category,
      isAvailable: meals.isAvailable,
    })
    .from(meals)
    .innerJoin(kitchens, eq(meals.kitchenId, kitchens.id))
    .where(
      and(
        eq(meals.isAvailable, true),
        isNull(meals.deletedAt),
        eq(kitchens.status, 'ACTIVE')
      )
    )

  return data.map(item => ({
    id: item.id,
    name: item.name,
    kitchenId: item.kitchenId,
    kitchenName: item.kitchenName,
    kitchenCity: item.kitchenCity,
    kitchenCitySlug: item.kitchenCitySlug,
    lat: item.latitude ? Number(item.latitude) : null,
    lng: item.longitude ? Number(item.longitude) : null,
    price: item.price,
    category: item.category || 'Uncategorized',
    isAvailable: item.isAvailable
  }))
}
