import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import SearchBar from "@/components/ui/SearchBar";
import PlatformReviewWidget from "@/components/reviews/PlatformReviewWidget";
import { FeaturedKitchens } from "@/components/home/FeaturedKitchens";
import SeoImageSection from "@/components/home/SeoImageSection";
import Image from "next/image";

export const metadata: Metadata = {
  title: 'Smart Tiffin – Daily Tiffin Service in Lahore, Karachi & Islamabad | From PKR 200',
  description: 'Find affordable daily tiffin service near you. Fresh ghar ka khana from trusted home cooks in Lahore, Karachi, Islamabad & Rawalpindi. Order via WhatsApp from PKR 200.',
  keywords: [
    'tiffin service lahore',
    'ghar ka khana karachi',
    'daily tiffin pakistan',
    'lunchbox service gulberg',
    'home cooked meals pakistan',
    'tiffin service islamabad',
    'affordable tiffin rawalpindi',
    'smart tiffin menu',
    'home food delivery pakistan',
    'monthly tiffin service lahore',
  ],
  authors: [{ name: 'Smart Tiffin' }],
  creator: 'Smart Tiffin',
  publisher: 'Smart Tiffin',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://smarttiffinfood.vercel.app',
  },
  openGraph: {
    type: 'website',
    locale: 'en_PK',
    url: 'https://smarttiffinfood.vercel.app',
    siteName: 'Smart Tiffin',
    title: 'Smart Tiffin – Affordable Home Cooked Meals in Pakistan',
    description: 'Order daily fresh ghar ka khana from home cooks near you. Starting from PKR 200. No app needed.',
    images: [
      {
        url: 'https://smarttiffinfood.vercel.app/api/og',
        width: 1200,
        height: 630,
        alt: 'Smart Tiffin – Home Cooked Meals Pakistan',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Smart Tiffin – Daily Tiffin Service from PKR 200',
    description: 'Fresh ghar ka khana from trusted home cooks in Lahore, Karachi, Islamabad.',
    images: ['https://smarttiffinfood.vercel.app/api/og'],
  },
}

const baseCities = [
  { name: "Lahore", emoji: "🏙️" },
  { name: "Karachi", emoji: "🌊" },
  { name: "Islamabad", emoji: "🏔️" },
  { name: "Rawalpindi", emoji: "🏢" },
  { name: "Faisalabad", emoji: "🏭" },
  { name: "Multan", emoji: "☀️" },
];

const features = [
  {
    icon: "🏠",
    title: "Home-Cooked Quality",
    desc: "Authentic meals prepared by local home cooks with love and care.",
  },
  {
    icon: "💰",
    title: "Affordable Prices",
    desc: "No middleman fees. Direct prices from cook to customer.",
  },
  {
    icon: "⭐",
    title: "Verified & Rated",
    desc: "Real reviews from real customers. Verified badge for trusted cooks.",
  },
  {
    icon: "📱",
    title: "Direct Contact",
    desc: "Connect directly with cooks via WhatsApp. No app dependency.",
  },
];

const howItWorks = [
  { step: "1", title: "Browse", desc: "Explore kitchens in your city. No login required." },
  { step: "2", title: "Choose", desc: "Pick your favorite meals from the menu." },
  { step: "3", title: "Contact", desc: "Connect directly with the cook via WhatsApp." },
  { step: "4", title: "Enjoy", desc: "Fresh home-cooked meal delivered to your door." },
];

const cities = baseCities.map((city) => ({
  ...city,
  count: "10+", // Placeholder or static value, or we could just remove the count entirely.
}));

export const revalidate = 3600; // Cache homepage for 1 hour now that live stats are gone

export default async function HomePage() {

  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Smart Tiffin',
    url: 'https://smarttiffinfood.vercel.app',
    logo: 'https://smarttiffinfood.vercel.app/smart-tiffin-logo.png',
    description: 'Pakistan\'s home food marketplace connecting customers with trusted home cooks.',
    foundingDate: '2024',
    areaServed: [
      'Lahore', 'Karachi', 'Islamabad',
      'Rawalpindi', 'Faisalabad', 'Multan'
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: 'support@smarttiffin.pk',
      availableLanguage: ['English', 'Urdu']
    },
    sameAs: []
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Smart Tiffin',
    url: 'https://smarttiffinfood.vercel.app',
    description: 'Find daily tiffin service near you in Pakistan',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate:
          'https://smarttiffinfood.vercel.app/explore?q={search_term_string}'
      },
      'query-input': 'required name=search_term_string'
    }
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is Smart Tiffin?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Smart Tiffin is Pakistan\'s home food marketplace that connects customers with trusted home cooks offering daily fresh meals in Lahore, Karachi, Islamabad and Rawalpindi.'
        }
      },
      {
        '@type': 'Question',
        name: 'How much does a tiffin service cost in Lahore?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Most meals on Smart Tiffin range between PKR 200–300 per serving. Full day plans (lunch + dinner) range from PKR 400–600 depending on the cook and menu.'
        }
      },
      {
        '@type': 'Question',
        name: 'Do I need an app to order from Smart Tiffin?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No. You can browse kitchens and order directly via WhatsApp without downloading any app.'
        }
      },
      {
        '@type': 'Question',
        name: 'Is the food on Smart Tiffin homemade?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. All meals are prepared in home kitchens by verified local cooks using fresh daily ingredients.'
        }
      },
      {
        '@type': 'Question',
        name: 'How do I become a home cook on Smart Tiffin?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Register your kitchen for free at smarttiffinfood.vercel.app/become-a-cook. List your menu, set your prices, and start receiving orders via WhatsApp.'
        }
      },
      {
        '@type': 'Question',
        name: 'Which cities does Smart Tiffin operate in?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Smart Tiffin currently operates in Lahore, Karachi, Islamabad, Rawalpindi, Faisalabad, and Multan. More cities coming soon.'
        }
      }
    ]
  };

  return (
    <div className="flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema)
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteSchema)
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema)
        }}
      />
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-neutral-900 dark:via-neutral-900 dark:to-neutral-800">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary-200/30 blur-3xl dark:bg-primary-900/20" />
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-accent-200/30 blur-3xl dark:bg-accent-900/20" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-block rounded-full bg-primary-100/80 px-4 py-1.5 text-sm font-medium text-primary-700 mb-6 animate-fade-in dark:bg-primary-900/40 dark:text-primary-300">
              🍱 Pakistan&apos;s #1 Home Food Platform
            </span>

            <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl animate-slide-up dark:text-neutral-50">
              Affordable Daily Tiffin Service in Pakistan -
            </h1>

            <p className="mt-6 text-lg text-neutral-600 leading-relaxed max-w-2xl mx-auto animate-slide-up dark:text-neutral-300" style={{ animationDelay: "0.1s" }}>
              Looking for an affordable tiffin service in Pakistan?
              Smart Tiffin connects you with trusted home cooks offering healthy homemade meals from PKR 200.
              Browse menus, read reviews, and order directly on WhatsApp — no app, no commission.
            </p>

            {/* Search Bar */}
            <div className="mt-10 animate-slide-up relative z-[60]" style={{ animationDelay: "0.2s" }}>
              <Suspense fallback={<div className="h-14 w-full max-w-2xl mx-auto bg-white/50 rounded-full animate-pulse" />}>
                <SearchBar />
              </Suspense>
            </div>

            {/* Quick Stats — Features (No DB Fetch) */}
            <div className="mt-10 flex flex-wrap justify-center gap-8 text-center animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <div>
                <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">PKR 200+</p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Starting Price</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">5km</p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Delivery Range</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">0%</p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Commission</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">100%</p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Home Cooked</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured Kitchens (Dynamic) ─────────────────────────── */}
      <Suspense fallback={<div className="h-64 w-full bg-neutral-100 animate-pulse rounded-2xl max-w-7xl mx-auto my-16" />}>
        <FeaturedKitchens />
      </Suspense>

      {/* ── SEO Image 1: Home Cook Preparing Food ─────────────────── */}
      <SeoImageSection
        src="/images/seo/home-cook-preparing-fresh-ghar-ka-khana.jpg"
        alt="Home cooked tiffin preparation in Lahore kitchen with fresh roti and curry"
        title="Home Cook Preparing Fresh Ghar Ka Khana"
        caption="Fresh home cooked meals prepared daily by trusted home chefs"
        description="A home cook preparing fresh roti and curry in a clean Pakistani kitchen. Smart Tiffin connects you with trusted home chefs offering daily tiffin services in Lahore, Karachi, and Islamabad. Enjoy healthy, homemade ghar ka khana cooked with fresh ingredients and delivered to your doorstep."
        priority
      />

      {/* ── Browse by City ──────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-neutral-900 sm:text-3xl dark:text-neutral-50">
            Browse by City
          </h2>
          <p className="mt-2 text-neutral-500 dark:text-neutral-400">
            Find home kitchens near you
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {cities.map((city) => (
            <Link
              key={city.name}
              href={`/city/${city.name.toLowerCase()}`}
              className="group flex flex-col items-center rounded-2xl bg-white border border-neutral-200/60 p-6 shadow-sm hover:shadow-lg hover:border-primary-300 transition-all duration-300 hover:-translate-y-1 dark:bg-neutral-800 dark:border-neutral-700 dark:hover:border-primary-600"
            >
              <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">{city.emoji}</span>
              <span className="font-semibold text-neutral-900 dark:text-neutral-100">{city.name}</span>
              <span className="text-xs text-neutral-400 mt-1">{city.count} kitchens</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── How It Works ────────────────────────────────────────── */}
      <section className="bg-neutral-50 dark:bg-neutral-900">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-neutral-900 sm:text-3xl dark:text-neutral-50">
              How It Works
            </h2>
            <p className="mt-2 text-neutral-500 dark:text-neutral-400">
              Getting home-cooked food is simple
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {howItWorks.map((item, i) => (
              <div key={i} className="relative text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-500 text-xl font-bold text-white shadow-lg shadow-primary-500/30">
                  {item.step}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-neutral-500 leading-relaxed dark:text-neutral-400">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SEO Image 2: Tiffin Delivery Service ──────────────────── */}
      <SeoImageSection
        src="/images/seo/affordable-tiffin-delivery-lahore.jpg"
        alt="Tiffin delivery service in Lahore with homemade food lunchbox"
        title="Affordable Tiffin Delivery in Lahore"
        caption="Affordable lunchbox delivery from home cooks near you"
        description="A customer receiving a homemade tiffin lunchbox from a local delivery partner in Lahore. Smart Tiffin makes it easy to order affordable lunchbox services in Gulberg and across Pakistan, connecting users directly with home cooks for fresh daily meals."
        reverse
      />

      {/* ── SEO Section 1: Why Switch ─────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center mb-12">
          <h2 className="text-2xl font-bold text-neutral-900 sm:text-3xl dark:text-neutral-50">
            Why Choose Home Cooked Tiffin Instead of Restaurant Food?
          </h2>
          <p className="mt-4 text-neutral-600 dark:text-neutral-400">
            Switching to a daily tiffin service offers health and financial benefits.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="bg-white dark:bg-neutral-800 p-8 rounded-2xl shadow-sm border border-neutral-200/60 dark:border-neutral-700">
            <ul className="space-y-4">
              {[
                "100% pure ingredients with no artificial food colors",
                "Cooked in hygienic home kitchens, not commercial setups",
                "Affordable daily pricing (Starting from PKR 200)",
                "Less oil and balanced spices for everyday eating",
                "Direct connection with local home chefs in your area"
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">✓</span>
                  <span className="text-neutral-700 dark:text-neutral-300">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="hidden md:block rounded-2xl overflow-hidden shadow-lg">
            <Image src="/images/seo/affordable-tiffin-delivery-lahore.jpg" alt="Home cooked tiffin delivery benefits" width={800} height={450} className="w-full h-full object-cover aspect-video" />
          </div>
        </div>
      </section>

      {/* ── SEO Section 2: Daily Menu ─────────────────────────────── */}
      <section className="bg-neutral-50 dark:bg-neutral-900 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-neutral-900 sm:text-3xl dark:text-neutral-50">
              Typical Daily Tiffin Menu
            </h2>
            <p className="mt-2 text-neutral-500 dark:text-neutral-400">
              Fresh ghar ka khana delivered to your office or home in Gulberg & Lahore.
            </p>
          </div>
          <ul className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            {[
              "Chicken Karahi & Roti",
              "Daal Chawal & Salad",
              "Aloo Gosht",
              "Mix Sabzi",
              "Biryani & Raita",
              "Kari Pakora",
              "Qeema Karelay",
              "White Chana"
            ].map((dish, idx) => (
              <li key={idx} className="bg-white dark:bg-neutral-800 p-4 rounded-xl border border-neutral-200/50 dark:border-neutral-700 shadow-sm text-neutral-700 dark:text-neutral-300 font-medium">
                {dish}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── SEO Section 3: Pricing Table ──────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-neutral-900 sm:text-3xl dark:text-neutral-50">
            Affordable Tiffin Pricing Plans
          </h2>
          <p className="mt-2 text-neutral-500 dark:text-neutral-400">
            Transparent pricing directly from cooks. No hidden fees.
          </p>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                <th className="p-4 font-semibold text-neutral-900 dark:text-neutral-100">Plan Type</th>
                <th className="p-4 font-semibold text-neutral-900 dark:text-neutral-100">Description</th>
                <th className="p-4 font-semibold text-neutral-900 dark:text-neutral-100">Estimated Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
              <tr className="bg-white dark:bg-neutral-900">
                <td className="p-4 font-medium text-neutral-900 dark:text-neutral-100">Single Meal</td>
                <td className="p-4 text-neutral-600 dark:text-neutral-400">One-time lunch or dinner box</td>
                <td className="p-4 text-primary-600 font-semibold dark:text-primary-400">PKR 200 - 350</td>
              </tr>
              <tr className="bg-white dark:bg-neutral-900">
                <td className="p-4 font-medium text-neutral-900 dark:text-neutral-100">Daily Lunch Plan</td>
                <td className="p-4 text-neutral-600 dark:text-neutral-400">Monthly lunch delivery to office</td>
                <td className="p-4 text-primary-600 font-semibold dark:text-primary-400">PKR 5,000 - 8,000/mo</td>
              </tr>
              <tr className="bg-white dark:bg-neutral-900">
                <td className="p-4 font-medium text-neutral-900 dark:text-neutral-100">Full Day Tiffin</td>
                <td className="p-4 text-neutral-600 dark:text-neutral-400">Lunch and Dinner combined</td>
                <td className="p-4 text-primary-600 font-semibold dark:text-primary-400">PKR 10,000 - 15,000/mo</td>
              </tr>
              <tr className="bg-white dark:bg-neutral-900">
                <td className="p-4 font-medium text-neutral-900 dark:text-neutral-100">Diet/Healthy Plan</td>
                <td className="p-4 text-neutral-600 dark:text-neutral-400">Customized low-calorie meals</td>
                <td className="p-4 text-primary-600 font-semibold dark:text-primary-400">Varies by Kitchen</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ── SEO Section 4: FAQ ────────────────────────────────────── */}
      <section className="bg-neutral-50 dark:bg-neutral-900 py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-neutral-900 sm:text-3xl dark:text-neutral-50">
              Frequently Asked Questions
            </h2>
          </div>
          <div className="space-y-4">
            {[
              { q: "What is Smart Tiffin?", a: "Smart Tiffin is Pakistan's home food marketplace that connects customers with trusted home cooks offering daily fresh meals in Lahore, Karachi, Islamabad and Rawalpindi." },
              { q: "How much does a tiffin service cost in Lahore?", a: "Most meals on Smart Tiffin range between PKR 200–300 per serving. Full day plans (lunch + dinner) range from PKR 400–600 depending on the cook and menu." },
              { q: "Do I need an app to order from Smart Tiffin?", a: "No. You can browse kitchens and order directly via WhatsApp without downloading any app." },
              { q: "Is the food on Smart Tiffin homemade?", a: "Yes. All meals are prepared in home kitchens by verified local cooks using fresh daily ingredients." },
              { q: "How do I become a home cook on Smart Tiffin?", a: "Register your kitchen for free at smarttiffinfood.vercel.app/become-a-cook. List your menu, set your prices, and start receiving orders via WhatsApp." },
              { q: "Which cities does Smart Tiffin operate in?", a: "Smart Tiffin currently operates in Lahore, Karachi, Islamabad, Rawalpindi, Faisalabad, and Multan. More cities coming soon." }
            ].map((faq, idx) => (
              <details key={idx} className="group bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 open:shadow-sm">
                <summary className="flex cursor-pointer items-center justify-between p-6 font-semibold text-neutral-900 dark:text-neutral-100 marker:content-none">
                  {faq.q}
                  <span className="ml-4 flex-shrink-0 transition-transform group-open:-rotate-180">
                    <svg className="h-5 w-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </summary>
                <div className="px-6 pb-6 text-neutral-600 dark:text-neutral-400">
                  <p>{faq.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Platform Reviews ─────────────────────────────────────── */}
      <PlatformReviewWidget />

      {/* ── Final CTA ────────────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-primary-500 to-primary-600">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Start Ordering Fresh Ghar Ka Khana Today
          </h2>
          <p className="mt-3 text-primary-100 max-w-lg mx-auto">
            Find the best local home cooks near you and enjoy affordable, healthy daily meals.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/explore"
              className="inline-block rounded-xl bg-white px-8 py-3 text-sm font-bold text-primary-600 shadow-lg hover:bg-primary-50 transition-all active:scale-95"
            >
              Browse Menus
            </Link>
            <Link
              href="/become-a-cook"
              className="inline-block rounded-xl bg-transparent border border-white px-8 py-3 text-sm font-bold text-white hover:bg-white/10 transition-all active:scale-95"
            >
              I am a Home Cook
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
