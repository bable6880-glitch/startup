import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://smarttiffin.com';

  // Core public static routes that should be indexed
  const routes = [
    '',
    '/explore',
    '/become-a-cook',
    '/login',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // Note: For a production scale-out, you could fetch SEO-friendly public 
  // kitchen profile slugs (`/kitchen/[slug]`) and active cities (`/city/[city]`)
  // from the database here and append them to the sitemap array.

  return [...routes];
}
