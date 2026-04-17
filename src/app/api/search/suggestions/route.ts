import { NextRequest } from "next/server"
import { apiSuccess } from "@/lib/utils/api-response"
import { getMealSearchIndex } from "@/lib/redis/search-index"
import { normalizeQuery, fuzzySearchMeals } from "@/lib/utils/fuzzy-search"
import { isWithinRadius, haversineKm } from "@/lib/utils/distance"
import { sanitizeText } from "@/lib/utils/sanitize"
import { redis } from "@/lib/redis"

function validateCoord(val: string | null, min: number, max: number): number | null {
  if (!val) return null
  const n = parseFloat(val)
  if (isNaN(n) || n < min || n > max) return null
  return n
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  
  const rawQ = searchParams.get('q')
  // Block suspicious patterns: HTML tags, js, path traversal, JSON injection
  const BLOCKED_PATTERNS = [
    /<[^>]+>/,
    /javascript:/i,
    /\.\.\//,
    /[{}[\]]/,
  ]
  if (BLOCKED_PATTERNS.some(p => p.test(rawQ ?? ''))) {
    return apiSuccess({ suggestions: [], query: '', originalQuery: rawQ, corrected: false })
  }

  const q = sanitizeText(rawQ ?? '').slice(0, 100)
  
  if (q.length < 2) {
    return apiSuccess({ suggestions: [], query: q, originalQuery: rawQ, corrected: false })
  }

  const lat = validateCoord(searchParams.get('lat'), -90, 90)
  const lng = validateCoord(searchParams.get('lng'), -180, 180)
  
  let radius = 5
  const rawRadius = searchParams.get('radius')
  if (rawRadius) {
    const r = parseFloat(rawRadius)
    if (!isNaN(r) && r > 0 && r <= 50) {
      radius = r
    }
  }

  const normalizedQ = normalizeQuery(q)
  const corrected = normalizedQ !== q.toLowerCase().trim()

  // Try fetching from Redis cache
  let cacheKey = `search:suggest:${normalizedQ}:global`
  if (lat !== null && lng !== null) {
    const lat2dp = Math.round(lat * 100) / 100
    const lng2dp = Math.round(lng * 100) / 100
    cacheKey = `search:suggest:${normalizedQ}:${lat2dp}:${lng2dp}`
  }

  if (redis) {
    try {
      const cached = await redis.get<any>(cacheKey)
      if (cached) {
        return apiSuccess(cached)
      }
    } catch { /* ignore */ }
  }

  const allMeals = await getMealSearchIndex()
  let filteredMeals = allMeals

  if (lat !== null && lng !== null) {
    filteredMeals = allMeals.filter(m => {
      if (m.lat === null || m.lng === null) return false
      return isWithinRadius(lat, lng, m.lat, m.lng, radius)
    })
  }

  const searchResults = fuzzySearchMeals(normalizedQ, filteredMeals)
  
  const suggestions = searchResults.map(meal => {
    let distanceKm: number | null = null
    if (lat !== null && lng !== null && meal.lat !== null && meal.lng !== null) {
      distanceKm = Math.round(haversineKm(lat, lng, meal.lat, meal.lng) * 10) / 10
    }
    return {
      mealId: meal.id,
      mealName: meal.name,
      kitchenId: meal.kitchenId,
      kitchenName: meal.kitchenName,
      price: meal.price,
      distanceKm,
      category: meal.category
    }
  })

  // Distance Sort
  if (lat !== null && lng !== null) {
    suggestions.sort((a, b) => {
      if (a.distanceKm === null) return 1
      if (b.distanceKm === null) return -1
      return a.distanceKm - b.distanceKm
    })
  } else {
    // Already sorted by fuzzy score in fuzzySearchMeals
  }

  const resultData = {
    suggestions,
    query: normalizedQ,
    originalQuery: rawQ,
    corrected
  }

  if (redis) {
    try {
      await redis.set(cacheKey, JSON.stringify(resultData), { ex: 60 })
    } catch { /* ignore */ }
  }

  return apiSuccess(resultData)
}
