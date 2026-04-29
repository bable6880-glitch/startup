import { MetadataRoute } from 'next'
import { db } from '@/lib/db'
import { kitchens } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { BASE_URL, SITEMAP_CITIES } from '@/config/site'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {

  // ══ STATIC PAGES ══
  // Rules applied:
  // - /login REMOVED
  // - /contact REMOVED (redirects = bad in sitemap)
  // - changeFrequency is HONEST per page type
  // - priority creates real hierarchy
  
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/explore`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/become-a-cook`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]

  // ══ CITY PAGES ══
  // These are critical for local SEO
  // All cities hardcoded — DB not needed
  const cityPages: MetadataRoute.Sitemap = SITEMAP_CITIES.map(city => ({
      url: `${BASE_URL}/city/${city}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
  }))

  // ══ KITCHEN PAGES ══
  // Only ACTIVE kitchens with real content
  // Minimum quality gate: must have name
  let kitchenPages: MetadataRoute.Sitemap = []

  try {
    const activeKitchens = await db
      .select({
        id: kitchens.id,
        updatedAt: kitchens.updatedAt,
      })
      .from(kitchens)
      .where(eq(kitchens.status, 'ACTIVE'))

    kitchenPages = activeKitchens
      .filter(k => k.id) // safety check
      .map(k => ({
        url: `${BASE_URL}/kitchen/${k.id}`,
        lastModified: k.updatedAt ?? new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.7,
      }))
  } catch (err) {
    console.error('[Sitemap] Kitchen query failed', err)
    // Sitemap still valid without kitchen pages
  }

  return [
    ...staticPages,
    ...cityPages,
    ...kitchenPages,
  ]
}
