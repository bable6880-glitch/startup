import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 
    process.env.NEXT_PUBLIC_APP_URL || 
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null) || 
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) || 
    'https://smarttiffin.com';
  
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/admin/',
        '/dashboard/',
        '/account/',
        '/seller/',
        '/orders/',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
