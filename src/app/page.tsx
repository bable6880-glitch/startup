import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import SearchBar from "@/components/ui/SearchBar";
import PlatformReviewWidget from "@/components/reviews/PlatformReviewWidget";
import { FeaturedKitchens } from "@/components/home/FeaturedKitchens";
import HomepageDynamicStats from "@/components/home/HomepageDynamicStats";
import CityCards from "@/components/home/CityCards";
import SeoImageSection from "@/components/home/SeoImageSection";
import Image from "next/image";
import { HeroBackground } from "@/components/home/LandingBackground";

export const metadata: Metadata = {
  title: 'Smart Tiffin – Homemade Food & Daily Tiffin Service in Pakistan',
  description: 'Find trusted home cooks offering daily tiffin service, monthly lunch plans, and homemade food delivery across Pakistan. Serving students, professionals, and families in Lahore, Islamabad, Karachi, and more.',
  keywords: [
    'tiffin service Pakistan',
    'homemade food delivery',
    'daily tiffin service',
    'tiffin service Lahore',
    'tiffin service Islamabad',
    'monthly lunch service',
    'home cooked food delivery',
    'ghar ka khana',
    'student tiffin service',
    'office lunch delivery',
    'lunch box service',
    'meal subscription Pakistan',
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
    title: 'Smart Tiffin – Homemade Food & Daily Tiffin Service in Pakistan',
    description: 'Connect with trusted home cooks for daily tiffin service, monthly meal plans, and homemade food delivery across Pakistan.',
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
    title: 'Smart Tiffin – Homemade Food & Daily Tiffin Service in Pakistan',
    description: 'Find daily tiffin services and homemade food delivery across Pakistan.',
    images: ['https://smarttiffinfood.vercel.app/api/og'],
  },
}

const howItWorks = [
  { step: "1", title: "Browse Available Cooks", desc: "Explore home cooks and food providers available in your area." },
  { step: "2", title: "View Menus and Packages", desc: "Review meal options, pricing, and available packages." },
  { step: "3", title: "Connect Directly", desc: "Contact cooks directly through WhatsApp for quick communication." },
  { step: "4", title: "Enjoy Fresh Meals", desc: "Receive freshly prepared homemade food delivered to your location." },
];

export const revalidate = 3600;

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
    description: 'Smart Tiffin connects customers with home cooks offering daily tiffin services, monthly meal plans, and homemade food delivery across Pakistan.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://smarttiffinfood.vercel.app/explore?q={search_term_string}'
      },
      'query-input': 'required name=search_term_string'
    }
  };

  return (
    <div className="flex flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
      
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <HeroBackground />

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
          <div className="text-center max-w-3xl mx-auto">
            <span className="inline-block rounded-full bg-primary-100/80 px-4 py-1.5 text-sm font-medium text-primary-700 mb-6 animate-fade-in dark:bg-primary-900/40 dark:text-primary-300">
              🍱 Pakistan&apos;s #1 Home Food Platform
            </span>

            <h1 className="text-4xl font-extrabold tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl animate-slide-up dark:text-neutral-50 leading-[1.15]">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 via-accent-500 to-primary-600 animate-gradient-x bg-[length:200%_auto]">
                Smart Tiffin – Homemade Food & Daily Tiffin Service in Pakistan
              </span>
            </h1>

            <div className="mt-6 text-lg text-neutral-600 leading-relaxed max-w-2xl mx-auto animate-slide-up dark:text-neutral-300 space-y-4 text-left sm:text-center" style={{ animationDelay: "0.1s" }}>
              <p>Finding healthy, affordable, and delicious homemade food every day can be challenging, especially for students, office workers, bachelors, hostellers, and families with busy schedules. Smart Tiffin is designed to solve this problem by connecting people with trusted home cooks who prepare fresh meals and deliver them directly to customers. Whether you are looking for a reliable tiffin service in Lahore, a daily lunch delivery in Islamabad, a monthly meal plan in Karachi, or affordable ghar ka khana anywhere in Pakistan, Smart Tiffin helps you discover homemade food options that suit your lifestyle and budget.</p>
              <p>Unlike traditional food delivery platforms that focus primarily on restaurants and fast food, Smart Tiffin is dedicated to homemade meals prepared with care in home kitchens. Our goal is to make nutritious, home-cooked food accessible to everyone while empowering talented home chefs to reach more customers.</p>
            </div>

            {/* Search Bar */}
            <div className="mt-10 animate-slide-up relative z-[60]" style={{ animationDelay: "0.2s" }}>
              <Suspense fallback={<div className="h-14 w-full max-w-2xl mx-auto bg-white/50 rounded-full animate-pulse" />}>
                <SearchBar />
              </Suspense>
            </div>

            {/* Quick Stats — Live from DB */}
            <Suspense fallback={
              <div className="mt-10 flex flex-wrap justify-center gap-8 text-center">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="min-w-[80px]">
                    <div className="mx-auto h-7 w-16 rounded-lg bg-primary-200/50 animate-pulse dark:bg-primary-800/30 mb-1" />
                    <div className="mx-auto h-4 w-20 rounded bg-neutral-200 animate-pulse dark:bg-neutral-700" />
                  </div>
                ))}
              </div>
            }>
              <HomepageDynamicStats />
            </Suspense>
          </div>
        </div>
      </section>

      {/* ── Featured Kitchens (Dynamic) ─────────────────────────── */}
      <Suspense fallback={<div className="h-64 w-full bg-neutral-100 animate-pulse rounded-2xl max-w-7xl mx-auto my-16" />}>
        <FeaturedKitchens />
      </Suspense>

      {/* ── SEO Image 1 ─────────────────── */}
      <SeoImageSection
        src="/images/seo/home-cook-preparing-fresh-ghar-ka-khana.jpg"
        alt="Fresh Homemade Food Delivered Daily"
        title="Fresh Homemade Food Delivered Daily"
        caption="Our home cooks prepare meals fresh every day using quality ingredients and traditional cooking methods."
        description="In today's fast-paced world, many people struggle to find time to cook healthy meals. Students living in hostels, professionals working long office hours, and individuals living away from their families often rely on expensive restaurant food or unhealthy fast-food options. Smart Tiffin bridges this gap by providing access to daily homemade meal services. Through our platform, users can browse local cooks, explore meal packages, compare options, and connect directly with food providers."
        priority
      />

      {/* ── Browse by City (Live counts) ──────────────────────────── */}
      <Suspense fallback={<div className="h-64 w-full max-w-7xl mx-auto animate-pulse bg-neutral-100 dark:bg-neutral-800 rounded-2xl my-16" />}>
        <CityCards />
      </Suspense>

      {/* ── How It Works -> Simple and Convenient Ordering ────────────────────────────────────────── */}
      <section className="relative bg-neutral-50 dark:bg-neutral-900">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-neutral-900 sm:text-3xl dark:text-neutral-50">
              Simple and Convenient Ordering
            </h2>
            <p className="mt-2 text-neutral-500 dark:text-neutral-400">
              Ordering homemade food should be easy. Smart Tiffin simplifies the process through a straightforward experience.
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
          <div className="mt-8 text-center text-sm text-neutral-500 dark:text-neutral-400 max-w-3xl mx-auto">
            This direct communication model allows customers and cooks to coordinate efficiently and build long-term relationships.
          </div>
        </div>
      </section>

      {/* ── SEO Image 2 ──────────────────── */}
      <SeoImageSection
        src="/images/seo/professional-tiffin-delivery.png"
        alt="Affordable Lunch Delivery for Office Workers"
        title="Affordable Lunch Delivery for Office Workers"
        caption="Busy professionals often struggle to prepare meals before work or find healthy lunch options during office hours."
        description="Smart Tiffin helps office workers connect with local cooks offering daily lunch delivery services. Whether you work in a corporate office, government institution, educational organization, or private company, finding a dependable lunch provider can improve your daily routine. Instead of skipping meals or relying on fast food, users can enjoy fresh homemade lunches delivered directly to their workplace."
        reverse
      />

      {/* ── SEO Section 1: Why Homemade Food Is Better Than Fast Food ─────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center mb-12">
          <h2 className="text-2xl font-bold text-neutral-900 sm:text-3xl dark:text-neutral-50">
            Why Homemade Food Is Better Than Fast Food
          </h2>
          <p className="mt-4 text-neutral-600 dark:text-neutral-400">
            Many people are becoming more conscious of their health and dietary habits. Restaurant meals and fast-food options often contain excessive oil, salt, preservatives, and calories.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="bg-white dark:bg-neutral-800 p-8 rounded-2xl shadow-sm border border-neutral-200/60 dark:border-neutral-700">
            <ul className="space-y-4">
              {[
                "Better Ingredients: Home cooks often use fresh ingredients and prepare food in smaller batches, resulting in higher-quality meals.",
                "Balanced Nutrition: Traditional homemade meals usually include balanced portions of protein, vegetables, carbohydrates, and healthy fats.",
                "Affordable Pricing: Homemade food is often more economical than ordering from restaurants every day.",
                "Familiar Taste: Many customers prefer homemade meals because they resemble the food prepared by their families.",
                "Healthier Lifestyle: Regular consumption of home-cooked meals can contribute to healthier eating habits and better overall wellness."
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">✓</span>
                  <span className="text-neutral-700 dark:text-neutral-300">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="hidden md:block rounded-2xl overflow-hidden shadow-lg">
            <Image src="/images/seo/professional-tiffin-lunchbox.png" alt="Why Homemade Food Is Better Than Fast Food" width={800} height={450} className="w-full h-full object-cover aspect-video" />
          </div>
        </div>
      </section>

      {/* ── SEO Section 2: Perfect for Every Lifestyle ─────────────────────────────── */}
      <section className="relative bg-neutral-50 dark:bg-neutral-900 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-neutral-900 sm:text-3xl dark:text-neutral-50">
              Perfect for Every Lifestyle
            </h2>
            <p className="mt-2 text-neutral-500 dark:text-neutral-400">
              Smart Tiffin serves a wide range of customers.
            </p>
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-center">
            {[
              "Students: Affordable meal plans for university and college students.",
              "Professionals: Convenient lunch and dinner delivery for busy office workers.",
              "Families: Reliable meal solutions for households needing occasional or regular support.",
              "Bachelors: Home-style meals for individuals living away from family.",
              "Seniors: Nutritious homemade food for older adults seeking convenient meal options.",
              "Remote Workers: Fresh meals delivered directly to your home workspace."
            ].map((dish, idx) => (
              <li key={idx} className="bg-white dark:bg-neutral-800 p-4 rounded-xl border border-neutral-200/50 dark:border-neutral-700 shadow-sm text-neutral-700 dark:text-neutral-300 font-medium">
                {dish}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── SEO Section 3: Find a Tiffin Service Near You ──────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-neutral-900 sm:text-3xl dark:text-neutral-50">
            Find a Tiffin Service Near You
          </h2>
          <p className="mt-2 text-neutral-500 dark:text-neutral-400">
            Many people search online for terms like:
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3 mb-8">
            {[
              "Tiffin service near me",
              "Home tiffin service",
              "Food tiffin delivery",
              "Daily lunch delivery",
              "Lunch box service",
              "Monthly lunch service",
              "Daily tiffin service",
              "Homemade food delivery",
              "Mess services",
              "Ghar ka khana"
            ].map((term, idx) => (
              <span key={idx} className="bg-white dark:bg-neutral-800 p-3 rounded-full border border-neutral-200 dark:border-neutral-700 shadow-sm text-neutral-700 dark:text-neutral-300 font-medium text-sm">
                {term}
              </span>
            ))}
        </div>
        <p className="text-center text-neutral-600 dark:text-neutral-400 max-w-3xl mx-auto">
          Smart Tiffin helps connect these users with local food providers offering reliable homemade meal solutions. As more cooks join our platform, customers gain access to a wider variety of cuisines, meal plans, and delivery options.
        </p>
      </section>

      {/* ── SEO Section 4: Remaining Content via FAQ-style layout ────────────────────────────────────── */}
      <section className="relative bg-neutral-50 dark:bg-neutral-900 py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-neutral-900 sm:text-3xl dark:text-neutral-50">
              Discover More About Smart Tiffin
            </h2>
          </div>
          <div className="space-y-4">
            {[
              { 
                q: "Daily Tiffin Service for Students", 
                a: "Thousands of students across Pakistan move away from home every year to attend universities and colleges. One of the biggest challenges they face is finding affordable and healthy food on a daily basis. Smart Tiffin helps students discover budget-friendly tiffin services that provide homemade meals throughout the month. Instead of spending money on expensive restaurant food, students can subscribe to affordable meal plans prepared by experienced home cooks.\n\nLiving situations: University hostels, Private hostels, Shared apartments, Rented accommodations, Student residences.\n\nServices: Daily lunch delivery, Daily dinner delivery, Weekly meal plans, Monthly food subscriptions, Affordable meal packages, Traditional homemade dishes.\n\nBy choosing homemade food, students can enjoy meals that are healthier, more affordable, and more similar to the food they enjoy at home." 
              },
              { 
                q: "Monthly Lunch Service and Meal Plans", 
                a: "One of the most popular options among our users is the monthly lunch service. Monthly meal subscriptions eliminate the need to place food orders every day and help customers maintain a consistent meal schedule.\n\nAdvantages: Cost-effective pricing, Reliable daily delivery, Consistent food quality, Time savings, Convenient scheduling, Personalized meal preferences.\n\nWhether you need lunch, dinner, or complete daily meal coverage, Smart Tiffin helps you find providers offering flexible subscription plans. Many customers prefer monthly plans because they simplify meal management and reduce daily decision-making." 
              },
              { 
                q: "Tiffin Service in Lahore", 
                a: "Lahore is one of Pakistan's largest cities and has a growing demand for homemade food delivery services. Students, professionals, and families frequently search for dependable tiffin services that provide fresh meals at affordable prices.\n\nServices: Daily tiffin service in Lahore, Monthly lunch service in Lahore, Homemade food delivery in Lahore, Office lunch delivery, Student meal plans, Family meal packages.\n\nAreas served: Gulberg, Johar Town, DHA, Model Town, Wapda Town, Bahria Town, and nearby areas.\n\nSmart Tiffin aims to connect you with reliable homemade food providers wherever you are in Lahore." 
              },
              { 
                q: "Tiffin Service in Islamabad", 
                a: "Islamabad has a large population of students, government employees, and professionals seeking healthy meal options. Many residents prefer homemade food over restaurant meals due to quality, hygiene, and affordability.\n\nServices: Tiffin service in Islamabad, Daily lunch delivery, Homemade food delivery, Monthly food subscriptions, Student meal plans, Office meal services.\n\nAreas served: G-13, G-11, G-10, F-11, F-10, E-11, H-13, Bahria Town, and surrounding areas." 
              },
              { 
                q: "Homemade Food Delivery Across Pakistan", 
                a: "Smart Tiffin is not limited to one city. Our vision is to make homemade food delivery accessible across Pakistan.\n\nCities: Lahore, Islamabad, Rawalpindi, Karachi, Faisalabad, Multan, Peshawar, Sialkot, Gujranwala, Abbottabad.\n\nAs our community continues to grow, more home cooks and food providers join the platform to serve customers in different regions." 
              },
              { 
                q: "Support Local Home Cooks", 
                a: "Smart Tiffin is more than a food platform. It is a community that supports talented home cooks and small food businesses. Many individuals possess exceptional cooking skills but struggle to reach customers. Our platform helps them showcase their menus, connect with customers, and grow their businesses.\n\nImpact: Support local entrepreneurs, Empower women-led businesses, Promote home-based kitchens, Strengthen local communities, Create economic opportunities.\n\nThis creates a win-win situation for both food providers and customers." 
              },
              { 
                q: "Our Mission", 
                a: "Our mission is simple: make homemade food accessible, affordable, and convenient for everyone in Pakistan. We believe that everyone deserves access to healthy, home-cooked meals regardless of their schedule, location, or lifestyle. By connecting customers with trusted home cooks, Smart Tiffin creates opportunities for both food lovers and culinary entrepreneurs." 
              }
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
                <div className="px-6 pb-6 text-neutral-600 dark:text-neutral-400 whitespace-pre-line">
                  {faq.a}
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
            Start Exploring Today
          </h2>
          <p className="mt-4 text-primary-100 max-w-2xl mx-auto leading-relaxed">
            Whether you are searching for a daily tiffin service, monthly lunch plan, homemade food delivery, lunch box service, or affordable ghar ka khana, Smart Tiffin helps you discover meal options that fit your needs. Browse available home cooks, explore meal packages, and connect directly with providers to enjoy fresh homemade food every day.
          </p>
          <div className="mt-6 text-sm text-white/80 font-medium tracking-wide">
            Smart Tiffin is your trusted platform for homemade food delivery, daily lunch service, monthly meal plans, and affordable tiffin services across Pakistan.
          </div>
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
