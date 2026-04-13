import { MetadataRoute } from 'next';
import { db } from "@/lib/db";
import { kitchens } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 
    process.env.NEXT_PUBLIC_APP_URL || 
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null) || 
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) || 
    'https://smarttiffin.com';

  // Core public static routes that should be indexed
  const staticRoutes = [
    '',
    '/explore',
    '/become-a-cook',
    '/login',
    '/about',
    '/contact',
    '/terms',
    '/privacy'
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  try {
    const activeKitchens = await db
      .select({ 
        slug: kitchens.slug, 
        updatedAt: kitchens.updatedAt, 
        citySlug: kitchens.citySlug 
      })
      .from(kitchens)
      .where(eq(kitchens.status, "ACTIVE"));

    const kitchenRoutes = activeKitchens.map((kitchen) => ({
      url: `${baseUrl}/kitchen/${kitchen.slug}`,
      lastModified: kitchen.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));

    const uniqueCities = Array.from(new Set(activeKitchens.map(k => k.citySlug)));
    const cityRoutes = uniqueCities.map((city) => ({
      url: `${baseUrl}/city/${city}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    }));

    return [...staticRoutes, ...cityRoutes, ...kitchenRoutes];
  } catch (error) {
    console.error("Failed to generate complete sitemap", error);
    return staticRoutes;
  }
}
