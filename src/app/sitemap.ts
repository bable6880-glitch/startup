import { MetadataRoute } from 'next'
import { db } from '@/lib/db'
import { kitchens } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { BASE_URL, SITEMAP_CITIES } from '@/config/site'

// ISR — regenerate sitemap every hour. Do NOT use force-dynamic
// (force-dynamic disables ISR and forces a full re-render on every Googlebot hit,
// wasting compute and making lastmod timestamps meaningless).
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {

  // ══ STATIC PAGES ══
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
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/become-a-cook`,
      lastModified: new Date('2025-01-01'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date('2025-01-01'),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/premium`,
      lastModified: new Date('2025-01-01'),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: new Date('2025-01-01'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: new Date('2025-01-01'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]

  // ══ CITY PAGES ══
  // Primary local SEO targets — highest priority after homepage
  const cityPages: MetadataRoute.Sitemap = SITEMAP_CITIES.map(city => ({
    url: `${BASE_URL}/city/${city}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.85,
  }))

  // ══ VANITY KEYWORD PAGES ══
  // Dedicated landing pages targeting exact-match searches like "tiffin service lahore"
  const vanityPages: MetadataRoute.Sitemap = [
    '/tiffin-service-lahore',
    '/tiffin-service-karachi',
    '/tiffin-service-islamabad',
    '/tiffin-service-rawalpindi',
    '/tiffin-service-faisalabad',
    '/tiffin-service-multan',
    '/tiffin-service-peshawar',
    '/tiffin-service-gujranwala',
    '/tiffin-service-sialkot',
    '/homemade-food-delivery-lahore',
    '/daily-lunch-delivery-lahore',
    '/lunch-box-service-lahore',
  ].map(path => ({
    url: `${BASE_URL}${path}`,
    lastModified: new Date('2025-06-01'),
    changeFrequency: 'monthly' as const,
    priority: 0.9, // High priority — exact keyword match pages
  }))

  // ══ KITCHEN PAGES ══
  // Only ACTIVE kitchens — soft-404 protection
  let kitchenPages: MetadataRoute.Sitemap = []

  try {
    const activeKitchens = await db
      .select({
        id: kitchens.id,
        slug: kitchens.slug,
        updatedAt: kitchens.updatedAt,
      })
      .from(kitchens)
      .where(eq(kitchens.status, 'ACTIVE'))

    kitchenPages = activeKitchens
      .filter(k => k.id)
      .map(k => ({
        url: `${BASE_URL}/kitchen/${k.slug ?? k.id}`,
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
    ...vanityPages,
    ...kitchenPages,
  ]
}
