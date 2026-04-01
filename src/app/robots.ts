import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://smarttiffin.com';
  
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
