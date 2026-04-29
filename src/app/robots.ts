import { MetadataRoute } from 'next'
import { BASE_URL } from '@/config/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // ══ MAIN RULE ══
      {
        userAgent: '*',
        allow: [
          '/',          // homepage
          '/explore',   // kitchen listing
          '/kitchen/',  // individual kitchens
          '/city/',     // city pages
          '/about',
          '/become-a-cook',
          '/terms',
          '/privacy',
        ],
        disallow: [
          // Auth - no SEO value
          '/login',
          '/register',
          '/complete-profile',
          // Private user pages
          '/account',
          '/account/',
          // Private cook pages
          '/dashboard',
          '/dashboard/',
          // Admin
          '/admin',
          '/admin/',
          // Seller routes
          '/seller',
          '/seller/',
          // API - never crawl
          '/api/',
          // Next.js internals
          '/_next/',
        ],
      },
      // ══ BLOCK AI TRAINING CRAWLERS ══
      // Protects your content from being used
      // to train AI models without permission
      {
        userAgent: 'GPTBot',
        disallow: ['/'],
      },
      {
        userAgent: 'ChatGPT-User',
        disallow: ['/'],
      },
      {
        userAgent: 'CCBot',
        disallow: ['/'],
      },
      {
        userAgent: 'anthropic-ai',
        disallow: ['/'],
      },
      {
        userAgent: 'Google-Extended',
        disallow: ['/'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  }
}
