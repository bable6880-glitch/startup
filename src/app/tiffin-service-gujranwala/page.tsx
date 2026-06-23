import type { Metadata } from 'next';
import { CityTiffinPage } from '@/components/seo/CityTiffinPage';

export const metadata: Metadata = {
  title: 'Tiffin Service Gujranwala | Homemade Food Delivery & Daily Meal Plans',
  description: 'Discover trusted tiffin services in Gujranwala offering homemade food delivery, daily lunch plans, student meal packages, and office lunch subscriptions.',
  keywords: [
    'tiffin service gujranwala',
    'homemade food delivery gujranwala',
    'daily lunch delivery gujranwala',
    'lunch box service gujranwala',
    'monthly meal plans gujranwala',
    'ghar ka khana gujranwala',
    'office lunch gujranwala',
  ],
  alternates: {
    canonical: 'https://smarttiffinfood.vercel.app/tiffin-service-gujranwala',
  },
  openGraph: {
    title: 'Tiffin Service Gujranwala | Homemade Food Delivery',
    description: 'Fresh homemade food delivered daily in Gujranwala.',
    url: 'https://smarttiffinfood.vercel.app/tiffin-service-gujranwala',
  },
};

const GUJRANWALA_FAQS = [
  {
    question: 'What is the best tiffin service in Gujranwala?',
    answer: 'Smart Tiffin helps customers discover trusted home kitchens offering fresh homemade meals and daily delivery throughout Gujranwala.',
  },
  {
    question: 'How much does a tiffin service cost in Gujranwala?',
    answer: 'Pricing varies based on meal type and subscription package. Most providers offer affordable plans for students and working professionals.',
  },
  {
    question: 'Can students order monthly meal plans in Gujranwala?',
    answer: 'Yes. Many home kitchens offer budget-friendly student meal subscriptions on weekly and monthly bases.',
  },
  {
    question: 'Do you offer office lunch delivery in Gujranwala?',
    answer: 'Yes. Many kitchens specialize in daily office lunch delivery across Gujranwala commercial areas.',
  },
  {
    question: 'Is homemade food healthier than fast food?',
    answer: 'Homemade meals use fresh ingredients and traditional cooking methods, making them a far healthier daily choice than restaurant fast food.',
  },
];

export default function TiffinServiceGujranwalaPage() {
  return (
    <CityTiffinPage
      city="Gujranwala"
      citySlug="gujranwala"
      areas={[
        'Trust Colony', 'Model Town', 'Peoples Colony',
        'Satellite Town', 'Cantt', 'GT Road', 'Rahwali',
      ]}
      universities={[
        'University of Gujranwala',
        'GC University Gujranwala',
        'Sialkot Medical College',
        'Hajvery University',
      ]}
      officeAreas={[
        'GT Road', 'Trust Colony', 'Model Town',
        'Satellite Town', 'Cantt Area',
      ]}
      relatedCities={[
        { name: 'Lahore', slug: 'lahore' },
        { name: 'Sialkot', slug: 'sialkot' },
        { name: 'Faisalabad', slug: 'faisalabad' },
        { name: 'Rawalpindi', slug: 'rawalpindi' },
        { name: 'Islamabad', slug: 'islamabad' },
      ]}
      faqs={GUJRANWALA_FAQS}
    />
  );
}
