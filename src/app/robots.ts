import { MetadataRoute } from 'next'
import { BASE_URL } from '@/config/site'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // ══ GOOGLEBOT & ALL LEGITIMATE CRAWLERS ══
      {
        userAgent: '*',
        allow: [
          '/',             // homepage
          '/explore',      // kitchen listing
          '/kitchen/',     // individual kitchen profiles
          '/city/',        // city pages
          '/about',        // about page
          '/become-a-cook',// cook sign-up
          '/terms',        // legal
          '/privacy',      // legal
          '/premium',      // premium plans page
          // Vanity SEO pages — exact keyword match landing pages
          '/tiffin-service-lahore',
          '/tiffin-service-karachi',
          '/tiffin-service-islamabad',
          '/tiffin-service-rawalpindi',
          '/tiffin-service-faisalabad',
          '/tiffin-service-multan',
          '/homemade-food-delivery-lahore',
          '/daily-lunch-delivery-lahore',
          '/lunch-box-service-lahore',
        ],
        disallow: [
          // Auth — no SEO value
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
          '/admin-portal',
          '/admin-portal/',
          // Seller routes
          '/seller',
          '/seller/',
          // API — never crawl
          '/api/',
          // Next.js internals
          '/_next/',
        ],
      },

      // ══ BLOCK AI TRAINING CRAWLERS ══
      // These crawlers scrape content to train LLMs — block them
      // but keep Google, Bing, and other search engines fully allowed.
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
