import Link from "next/link";
import SearchBar from "@/components/ui/SearchBar";
import { FeaturedKitchens } from "@/components/home/FeaturedKitchens";
import { db } from "@/lib/db";
import { kitchens, users, meals } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

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

// ─── Live stats from DB (server component — no HTTP round-trip) ─────────────

function formatStat(n: number): string {
  if (n >= 1000) return `${Math.floor(n / 1000)}K+`;
  if (n >= 100) return `${Math.floor(n / 100) * 100}+`;
  if (n >= 10) return `${Math.floor(n / 10) * 10}+`;
  return String(n);
}

async function getStats() {
  try {
    const [kitchenCount] = await db
      .select({ count: db.$count(kitchens, eq(kitchens.status, "ACTIVE")) })
      .from(kitchens);

    const [mealCount] = await db
      .select({ count: db.$count(meals, eq(meals.isAvailable, true)) })
      .from(meals);

    const [userCount] = await db
      .select({ count: db.$count(users, eq(users.isActive, true)) })
      .from(users);

    const cityCountsRaw = await db
      .select({
        city: kitchens.city,
        count: sql<number>`count(${kitchens.id})`.mapWith(Number),
      })
      .from(kitchens)
      .where(eq(kitchens.status, "ACTIVE"))
      .groupBy(kitchens.city);

    const cityCounts = cityCountsRaw.reduce((acc, curr) => {
      acc[curr.city.toLowerCase()] = curr.count;
      return acc;
    }, {} as Record<string, number>);

    return {
      kitchens: Number(kitchenCount.count),
      meals: Number(mealCount.count),
      customers: Number(userCount.count),
      cityCounts,
    };
  } catch (error) {
    console.error("Failed to fetch stats:", error);
    return { kitchens: 0, meals: 0, customers: 0, cityCounts: {} };
  }
}

export const revalidate = 0; // Real-time updates as requested

export default async function HomePage() {
  const stats = await getStats();

  const cities = baseCities.map((city) => {
    const rawCount = stats.cityCounts[city.name.toLowerCase()] || 0;
    return {
      ...city,
      count: rawCount.toString(),
    };
  });

  return (
    <div className="flex flex-col">
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
              Home-Cooked Meals,{" "}
              <span className="text-gradient">Delivered Fresh</span>
            </h1>

            <p className="mt-6 text-lg text-neutral-600 leading-relaxed max-w-2xl mx-auto animate-slide-up dark:text-neutral-300" style={{ animationDelay: "0.1s" }}>
              Discover authentic home kitchens in your city. Browse menus, check ratings,
              and connect directly with cooks. No middleman, no markups.
            </p>

            {/* Search Bar */}
            <div className="mt-10 animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <SearchBar />
            </div>

            {/* Quick Stats — live from DB */}
            <div className="mt-10 flex flex-wrap justify-center gap-8 text-center animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <div>
                <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{formatStat(stats.kitchens)}</p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Home Kitchens</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{formatStat(stats.meals)}</p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Menu Items</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{formatStat(stats.customers)}</p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">Happy Customers</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured Kitchens (Dynamic) ─────────────────────────── */}
      <FeaturedKitchens />

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

      {/* ── Features ────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl font-bold text-neutral-900 sm:text-3xl dark:text-neutral-50">
            Why Smart Tiffin?
          </h2>
          <p className="mt-2 text-neutral-500 dark:text-neutral-400">
            Built for home cooks and food lovers
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <div
              key={i}
              className="rounded-2xl bg-white border border-neutral-200/60 p-6 shadow-sm hover:shadow-md transition-shadow dark:bg-neutral-800 dark:border-neutral-700"
            >
              <span className="text-3xl">{f.icon}</span>
              <h3 className="mt-3 text-base font-semibold text-neutral-900 dark:text-neutral-100">
                {f.title}
              </h3>
              <p className="mt-2 text-sm text-neutral-500 leading-relaxed dark:text-neutral-400">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-primary-500 to-primary-600">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Are You a Home Cook?
          </h2>
          <p className="mt-3 text-primary-100 max-w-lg mx-auto">
            List your kitchen, reach customers, and grow your home food business. It&apos;s free to start!
          </p>
          <Link
            href="/become-a-cook"
            className="mt-6 inline-block rounded-xl bg-white px-8 py-3 text-sm font-bold text-primary-600 shadow-lg hover:bg-primary-50 transition-all active:scale-95"
          >
            Start Cooking Today →
          </Link>
        </div>
      </section>

      {/* ── About Platform (SEO) ─────────────────────────────────── */}
      <section id="about-platform" className="bg-white dark:bg-neutral-900">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center mb-12">
            <h2 className="text-3xl font-bold text-neutral-900 sm:text-4xl dark:text-neutral-50 mb-6">
              Pakistan&apos;s Home Cooked Food Marketplace
            </h2>
            <div className="space-y-4 text-lg text-neutral-600 leading-relaxed dark:text-neutral-300">
              <p>
                Smart Tiffin connects you with passionate local home cooks offering fresh, hygienic, and affordable meals. By empowering independent cooks, we bring you the authentic taste of homemade food without restaurant markups.
              </p>
              <p>
                Whether you need a daily lunch delivery to your office, a reliable monthly tiffin service, or just a hearty home-cooked dinner for the family, our platform makes it easy to browse menus, read verified reviews, and connect directly with cooks.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-2xl bg-neutral-50 border border-neutral-200/60 p-6 text-center shadow-sm dark:bg-neutral-800 dark:border-neutral-700">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-600 mb-4 dark:bg-primary-900/30 dark:text-primary-400">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2 dark:text-neutral-100">Freshly Prepared</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Every meal is made fresh to order using quality household ingredients, ensuring you get healthy food every day.
              </p>
            </div>
            
            <div className="rounded-2xl bg-neutral-50 border border-neutral-200/60 p-6 text-center shadow-sm dark:bg-neutral-800 dark:border-neutral-700">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-100 text-accent-600 mb-4 dark:bg-accent-900/30 dark:text-accent-400">
                 <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2 dark:text-neutral-100">Flexible Delivery</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Choose between individual on-demand meals or set up a recurring tiffin schedule that fits your routine.
              </p>
            </div>

            <div className="rounded-2xl bg-neutral-50 border border-neutral-200/60 p-6 text-center shadow-sm dark:bg-neutral-800 dark:border-neutral-700">
               <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-600 mb-4 dark:bg-primary-900/30 dark:text-primary-400">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2 dark:text-neutral-100">Clean & Hygienic</h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Our local cooks maintain strict home hygiene standards, giving you peace of mind with every bite.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
