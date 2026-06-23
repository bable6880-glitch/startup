import type { Metadata } from 'next';
import { CityTiffinPage } from '@/components/seo/CityTiffinPage';

export const metadata: Metadata = {
  title: 'Tiffin Service Peshawar | Homemade Food Delivery & Daily Lunch Plans',
  description: 'Find trusted tiffin services in Peshawar offering homemade food delivery, daily lunch plans, office meal subscriptions, and monthly meal packages.',
  keywords: [
    'tiffin service peshawar',
    'homemade food delivery peshawar',
    'daily lunch delivery peshawar',
    'lunch box service peshawar',
    'monthly meal plans peshawar',
    'ghar ka khana peshawar',
    'student food delivery peshawar',
    'office lunch delivery peshawar',
  ],
  alternates: {
    canonical: 'https://smarttiffinfood.vercel.app/tiffin-service-peshawar',
  },
  openGraph: {
    title: 'Tiffin Service Peshawar | Homemade Food Delivery',
    description: 'Fresh homemade food delivered daily in Peshawar.',
    url: 'https://smarttiffinfood.vercel.app/tiffin-service-peshawar',
  },
};

const PESHAWAR_FAQS = [
  {
    question: 'What is the best tiffin service in Peshawar?',
    answer: 'Smart Tiffin helps customers discover trusted home kitchens offering fresh homemade meals and daily delivery services throughout Peshawar.',
  },
  {
    question: 'How much does a tiffin service cost in Peshawar?',
    answer: 'Pricing depends on meal type, delivery location, and subscription package. Most providers offer affordable daily and monthly meal plans.',
  },
  {
    question: 'Can I order monthly meal plans in Peshawar?',
    answer: 'Yes. Many kitchens offer weekly and monthly subscriptions for lunch and dinner delivery across Peshawar.',
  },
  {
    question: 'Do you provide office lunch delivery in Peshawar?',
    answer: 'Yes. Many home kitchens specialize in daily lunch delivery for offices and workplaces throughout Peshawar.',
  },
  {
    question: 'Is homemade food healthier than restaurant food?',
    answer: 'Homemade meals are generally prepared using fresh ingredients and traditional cooking methods, making them a healthier option for daily consumption.',
  },
];

export default function TiffinServicePeshawarPage() {
  return (
    <CityTiffinPage
      city="Peshawar"
      citySlug="peshawar"
      areas={[
        'Hayatabad', 'University Town', 'Saddar', 'Cantt',
        'Ring Road', 'Gulbahar', 'Dalazak Road', 'Warsak Road',
      ]}
      universities={[
        'University of Peshawar',
        'UET Peshawar',
        'Islamia College University',
        'Khyber Medical University',
        'City University Peshawar',
      ]}
      officeAreas={[
        'Saddar', 'Cantt', 'Hayatabad Phase 1–7',
        'University Town', 'Ring Road',
      ]}
      relatedCities={[
        { name: 'Islamabad', slug: 'islamabad' },
        { name: 'Rawalpindi', slug: 'rawalpindi' },
        { name: 'Lahore', slug: 'lahore' },
        { name: 'Karachi', slug: 'karachi' },
        { name: 'Faisalabad', slug: 'faisalabad' },
      ]}
      faqs={PESHAWAR_FAQS}
    />
  );
}
