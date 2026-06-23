import type { Metadata } from 'next';
import { CityTiffinPage } from '@/components/seo/CityTiffinPage';

export const metadata: Metadata = {
  title: 'Tiffin Service Sialkot | Homemade Food Delivery & Daily Lunch Plans',
  description: 'Find reliable tiffin services in Sialkot offering homemade food delivery, daily lunch plans, monthly meal subscriptions, and office lunch packages.',
  keywords: [
    'tiffin service sialkot',
    'homemade food delivery sialkot',
    'daily lunch delivery sialkot',
    'lunch box service sialkot',
    'monthly meal plans sialkot',
    'ghar ka khana sialkot',
    'office lunch sialkot',
  ],
  alternates: {
    canonical: 'https://smarttiffinfood.vercel.app/tiffin-service-sialkot',
  },
  openGraph: {
    title: 'Tiffin Service Sialkot | Homemade Food Delivery',
    description: 'Fresh homemade food delivered daily in Sialkot.',
    url: 'https://smarttiffinfood.vercel.app/tiffin-service-sialkot',
  },
};

const SIALKOT_FAQS = [
  {
    question: 'What is the best tiffin service in Sialkot?',
    answer: 'Smart Tiffin helps customers discover trusted home kitchens offering fresh homemade meals and daily delivery across Sialkot.',
  },
  {
    question: 'How much does a tiffin service cost in Sialkot?',
    answer: 'Pricing varies depending on meal type, delivery area, and subscription package. Most providers offer affordable daily and monthly options.',
  },
  {
    question: 'Can I find monthly meal plans in Sialkot?',
    answer: 'Yes. Many kitchens provide weekly and monthly meal subscriptions for students, office workers, and families.',
  },
  {
    question: 'Is there lunch box delivery available in Sialkot?',
    answer: 'Yes. Several home kitchens offer daily lunch box delivery to offices, hostels, and homes across Sialkot.',
  },
  {
    question: 'Is homemade food healthier than restaurant food in Sialkot?',
    answer: 'Absolutely. Homemade meals are prepared fresh using quality ingredients and traditional methods, making them a healthier daily choice.',
  },
];

export default function TiffinServiceSialkotPage() {
  return (
    <CityTiffinPage
      city="Sialkot"
      citySlug="sialkot"
      areas={[
        'Cantt', 'Iqbal Town', 'Paris Road', 'Defence Road',
        'Sambrial', 'Daska Road', 'Hajipura',
      ]}
      universities={[
        'University of Sialkot',
        'Sialkot Medical College',
        'COMSATS Sialkot',
        'University of Management & Technology Sialkot',
      ]}
      officeAreas={[
        'Cantt', 'Paris Road', 'Defence Road',
        'Iqbal Town', 'Sambrial Industrial Area',
      ]}
      relatedCities={[
        { name: 'Gujranwala', slug: 'gujranwala' },
        { name: 'Lahore', slug: 'lahore' },
        { name: 'Faisalabad', slug: 'faisalabad' },
        { name: 'Rawalpindi', slug: 'rawalpindi' },
        { name: 'Islamabad', slug: 'islamabad' },
      ]}
      faqs={SIALKOT_FAQS}
    />
  );
}
