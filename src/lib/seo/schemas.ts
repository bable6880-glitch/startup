import { BASE_URL } from '@/config/site';

export function buildFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export function buildOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Smart Tiffin',
    url: BASE_URL,
    logo: `${BASE_URL}/smart-tiffin-logo.png`,
    description: "Pakistan's marketplace for homemade food delivery and tiffin services.",
    foundingDate: '2024',
    areaServed: 'PK',
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'support@smarttiffin.pk',
      contactType: 'customer service',
      availableLanguage: ['English', 'Urdu'],
    },
    sameAs: [],
  };
}

export function buildWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Smart Tiffin',
    url: BASE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BASE_URL}/explore?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function buildBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function buildLocalBusinessSchema(city: string, options?: {
  priceRange?: string;
  cuisines?: string[];
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FoodDeliveryService',
    name: `Smart Tiffin ${city}`,
    url: `${BASE_URL}/city/${city.toLowerCase()}`,
    areaServed: {
      '@type': 'City',
      name: city,
      addressCountry: 'PK',
    },
    priceRange: options?.priceRange ?? '₨₨',
    servesCuisine: options?.cuisines ?? ['Pakistani', 'Homemade', 'Traditional'],
    description: `Homemade food delivery and tiffin service in ${city}, Pakistan.`,
  };
}

export function buildKitchenSchema(kitchen: {
  name: string;
  description?: string | null;
  city: string;
  cuisines?: string[];
  avgRating?: number | null;
  reviewCount?: number;
  images?: string[];
  slug?: string | null;
  id: string;
}) {
  const url = `${BASE_URL}/kitchen/${kitchen.slug ?? kitchen.id}`;

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'FoodEstablishment',
    name: kitchen.name,
    url,
    description: kitchen.description ?? `Fresh homemade food from ${kitchen.name} in ${kitchen.city}, Pakistan.`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: kitchen.city,
      addressRegion: kitchen.city,
      addressCountry: 'PK',
    },
    areaServed: {
      '@type': 'City',
      name: kitchen.city,
    },
    priceRange: '₨₨',
    servesCuisine: kitchen.cuisines ?? ['Pakistani', 'Homemade'],
    hasMenu: url,
    telephone: undefined, // do not expose cook phone numbers publicly
  };

  // Only add AggregateRating if the kitchen actually has reviews
  // Google will penalize fake or zero-review ratings
  if (kitchen.reviewCount && kitchen.reviewCount > 0 && kitchen.avgRating) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: Math.round(kitchen.avgRating * 10) / 10, // round to 1 decimal
      reviewCount: kitchen.reviewCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  // Only add image if it exists
  if (kitchen.images?.[0]) {
    schema.image = kitchen.images[0];
  }

  return schema;
}
