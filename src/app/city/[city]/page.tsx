import type { Metadata } from "next";
import Link from "next/link";
import KitchenCard from "@/components/ui/KitchenCard";
import SearchBar from "@/components/ui/SearchBar";
import { SITEMAP_CITIES, BASE_URL } from "@/config/site";
import { listKitchens } from "@/services/kitchen.service";

// ── City display names & SEO metadata ────────────────────────────────────────
const CITY_META: Record<string, {
    displayName: string;
    tagline: string;
    description: string;
    neighborhoods: string[];
    area: string;
    priceFrom: number;
    slug: string;
}> = {
    lahore: {
        displayName: "Lahore",
        tagline: "Pakistan's Food Capital",
        description: "Find affordable daily tiffin service in Lahore from trusted home cooks. Fresh ghar ka khana delivered to DHA, Gulberg, Johar Town, Model Town & across Lahore. Starting from PKR 200.",
        neighborhoods: ["DHA", "Gulberg", "Johar Town", "Model Town", "Bahria Town", "Valencia", "Cantt", "Faisal Town", "Township", "Iqbal Town"],
        area: "Lahore, Punjab",
        priceFrom: 200,
        slug: "tiffin-service-lahore",
    },
    karachi: {
        displayName: "Karachi",
        tagline: "Pakistan's Business Hub",
        description: "Order fresh home-cooked meals in Karachi from verified local cooks. Daily tiffin delivery across Clifton, DHA, Gulshan, North Nazimabad & all major Karachi neighbourhoods. From PKR 220.",
        neighborhoods: ["Clifton", "DHA", "Gulshan-e-Iqbal", "North Nazimabad", "PECHS", "Saddar", "Korangi", "Malir", "Bahria Town", "Scheme 33"],
        area: "Karachi, Sindh",
        priceFrom: 220,
        slug: "tiffin-service-karachi",
    },
    islamabad: {
        displayName: "Islamabad",
        tagline: "The Green Capital",
        description: "Discover home-cooked tiffin service in Islamabad from professional home cooks. Fresh daily meals delivered to F-sectors, G-sectors, E-sectors & Bahria Town Islamabad. From PKR 250.",
        neighborhoods: ["F-10", "F-11", "G-11", "G-9", "I-8", "E-7", "F-6", "F-7", "Bahria Town", "DHA Islamabad"],
        area: "Islamabad, ICT",
        priceFrom: 250,
        slug: "tiffin-service-islamabad",
    },
    rawalpindi: {
        displayName: "Rawalpindi",
        tagline: "The Twin City",
        description: "Book affordable tiffin service in Rawalpindi. Home cooks serving fresh ghar ka khana across Saddar, Westridge, Bahria Town & all Rawalpindi areas. Starting from PKR 200.",
        neighborhoods: ["Saddar", "Westridge", "Bahria Town", "Gulrez", "Chaklala", "Committee Chowk", "Satellite Town", "Cantt"],
        area: "Rawalpindi, Punjab",
        priceFrom: 200,
        slug: "tiffin-service-rawalpindi",
    },
    faisalabad: {
        displayName: "Faisalabad",
        tagline: "Pakistan's Manchester",
        description: "Find trusted home cooks offering daily tiffin service in Faisalabad. Fresh home-cooked meals delivered across Peoples Colony, Gulberg, Millat Town & all Faisalabad areas. From PKR 180.",
        neighborhoods: ["Peoples Colony", "Gulberg", "Millat Town", "Canal Road", "Jhang Road", "Samundri Road", "Koh-e-Noor"],
        area: "Faisalabad, Punjab",
        priceFrom: 180,
        slug: "tiffin-service-faisalabad",
    },
    multan: {
        displayName: "Multan",
        tagline: "City of Saints",
        description: "Get fresh home-cooked tiffin service in Multan from local home cooks. Daily ghar ka khana delivery across Cantt, Shah Rukn-e-Alam, Bohar Gate & all Multan areas. From PKR 180.",
        neighborhoods: ["Cantt", "Shah Rukn-e-Alam", "Bohar Gate", "Vehari Road", "Bosan Road", "DHA Multan", "Gulgasht Colony"],
        area: "Multan, Punjab",
        priceFrom: 180,
        slug: "tiffin-service-multan",
    },
    peshawar: {
        displayName: "Peshawar",
        tagline: "City of Flowers",
        description: "Discover home-cooked tiffin service in Peshawar from verified local cooks. Fresh Peshawari-style home food delivered across University Town, Hayatabad & across KPK's capital. From PKR 180.",
        neighborhoods: ["University Town", "Hayatabad", "Saddar", "Cantt", "Phase 1-7", "Board Bazar", "Ring Road"],
        area: "Peshawar, KPK",
        priceFrom: 180,
        slug: "tiffin-service-peshawar",
    },
    sialkot: {
        displayName: "Sialkot",
        tagline: "City of Exporters",
        description: "Order fresh daily tiffin in Sialkot from trusted home cooks. Ghar ka khana delivered across Cantt, Iqbal Park, Defence Colony & all major Sialkot localities. From PKR 180.",
        neighborhoods: ["Cantt", "Iqbal Park", "Defence Colony", "Paris Road", "Sialkot Bypass", "Wazirabad Road"],
        area: "Sialkot, Punjab",
        priceFrom: 180,
        slug: "tiffin-service-sialkot",
    },
    gujranwala: {
        displayName: "Gujranwala",
        tagline: "City of Wrestlers",
        description: "Find home-cooked tiffin service in Gujranwala from local cooks. Fresh daily meals delivered across Satellite Town, Civil Lines, Peoples Colony & all Gujranwala areas. From PKR 180.",
        neighborhoods: ["Satellite Town", "Civil Lines", "Peoples Colony", "Gondlanwala Road", "GT Road", "Rehman Town"],
        area: "Gujranwala, Punjab",
        priceFrom: 180,
        slug: "tiffin-service-gujranwala",
    },
};

type Props = { params: Promise<{ city: string }> };

// ── SSG: pre-render all supported city pages at build time ────────────────────
export function generateStaticParams() {
    return SITEMAP_CITIES.map((city) => ({ city }));
}

// ── ISR: update every 10 minutes in background ────────────────────────────────
export const revalidate = 600;

// ── Metadata ──────────────────────────────────────────────────────────────────
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { city } = await params;
    const meta = CITY_META[city.toLowerCase()] ?? {
        displayName: city.charAt(0).toUpperCase() + city.slice(1),
        description: `Find daily tiffin service in ${city}. Fresh home-cooked meals from trusted local cooks.`,
        tagline: "Pakistan",
        slug: `tiffin-service-${city}`,
    };

    const cityName = meta.displayName;

    return {
        title: `Tiffin Service in ${cityName} – Home Cooked Meals from PKR ${meta.priceFrom} | Smart Tiffin`,
        description: meta.description,
        robots: {
            index: true,
            follow: true,
            googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
        },
        alternates: {
            canonical: `${BASE_URL}/city/${city.toLowerCase()}`,
        },
        openGraph: {
            title: `Tiffin Service in ${cityName} | Smart Tiffin`,
            description: `Home cooked meals in ${cityName} from PKR ${meta.priceFrom}. Fresh daily tiffin from trusted local cooks.`,
            url: `${BASE_URL}/city/${city.toLowerCase()}`,
            siteName: 'Smart Tiffin',
            locale: 'en_PK',
            type: 'website',
            images: [
                {
                    url: `${BASE_URL}/api/og?city=${encodeURIComponent(cityName)}`,
                    width: 1200,
                    height: 630,
                    alt: `Tiffin Service in ${cityName} – Smart Tiffin`,
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title: `Tiffin Service in ${cityName} | Smart Tiffin`,
            description: `Home cooked meals in ${cityName} from PKR ${meta.priceFrom}. Find trusted home cooks near you.`,
            images: [`${BASE_URL}/api/og?city=${encodeURIComponent(cityName)}`],
        },
    };
}

// ── Blocking kitchen fetch (no Suspense) — ensures Googlebot sees real content ─
async function fetchCityKitchens(cityName: string) {
    try {
        const result = await listKitchens({
            city: cityName,
            limit: 20,
            page: 1,
            sort: "boost",
            radiusKm: 10,
        });
        return result.kitchens || [];
    } catch {
        return [];
    }
}

// ── City-specific SEO content ─────────────────────────────────────────────────
function CitySEOSection({ city, meta }: {
    city: string;
    meta: typeof CITY_META[string] & { displayName: string };
}) {
    const cityName = meta.displayName;
    const neighborhoods = meta.neighborhoods ?? [];

    return (
        <article className="mt-16 pt-12 border-t border-neutral-200 dark:border-neutral-800">
            <div className="max-w-4xl mx-auto space-y-12">

                {/* Introduction */}
                <section>
                    <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
                        Daily Tiffin Service in {cityName} — Fresh Ghar Ka Khana Delivered to Your Door
                    </h2>
                    <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
                        Smart Tiffin connects you with the best home cooks offering daily tiffin service in {cityName}.
                        Whether you are a working professional, a student living away from family, or someone who simply
                        wants affordable ghar ka khana without cooking every day — our {cityName} home kitchen directory
                        has you covered.
                    </p>
                    <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
                        All cooks on Smart Tiffin are local residents of {cityName} who prepare fresh meals in their
                        own homes. There are no restaurant markups, no commission fees, and no hidden charges.
                        You pay the cook directly — via cash or EasyPaisa/JazzCash — and enjoy home-cooked food
                        starting from just PKR {meta.priceFrom}.
                    </p>
                    <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                        Ordering is simple: browse kitchens below, view menus and ratings, and click the WhatsApp
                        button to contact the cook directly. No app download required, no registration needed.
                    </p>
                </section>

                {/* Delivery Areas */}
                <section>
                    <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">
                        Tiffin Delivery Areas in {cityName}
                    </h3>
                    <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                        Our {cityName} home cooks deliver across all major neighbourhoods and areas:
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                        {neighborhoods.map((n) => (
                            <span
                                key={n}
                                className="inline-block rounded-full bg-primary-50 dark:bg-primary-900/20 px-3 py-1 text-sm font-medium text-primary-700 dark:text-primary-300 border border-primary-100 dark:border-primary-800"
                            >
                                {n}
                            </span>
                        ))}
                    </div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        Don't see your area? Contact a cook directly on WhatsApp — many extend their delivery
                        zone for regular tiffin subscribers in {cityName}.
                    </p>
                </section>

                {/* Pricing Table */}
                <section>
                    <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">
                        Tiffin Service Prices in {cityName}
                    </h3>
                    <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                        Below are typical tiffin prices from home cooks in {cityName}. Prices may vary
                        based on menu items, ingredients, and delivery distance.
                    </p>
                    <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-neutral-50 dark:bg-neutral-800">
                                <tr>
                                    <th className="p-3 font-semibold text-neutral-900 dark:text-neutral-100">Plan Type</th>
                                    <th className="p-3 font-semibold text-neutral-900 dark:text-neutral-100">What's Included</th>
                                    <th className="p-3 font-semibold text-neutral-900 dark:text-neutral-100">Estimated Price</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                                <tr className="bg-white dark:bg-neutral-900">
                                    <td className="p-3 font-medium text-neutral-900 dark:text-neutral-100">Single Meal</td>
                                    <td className="p-3 text-neutral-600 dark:text-neutral-400">Lunch or dinner (roti + sabzi or rice dish)</td>
                                    <td className="p-3 font-semibold text-primary-600 dark:text-primary-400">PKR {meta.priceFrom}–350</td>
                                </tr>
                                <tr className="bg-white dark:bg-neutral-900">
                                    <td className="p-3 font-medium text-neutral-900 dark:text-neutral-100">Daily Lunch</td>
                                    <td className="p-3 text-neutral-600 dark:text-neutral-400">Monday–Friday lunch delivery to office</td>
                                    <td className="p-3 font-semibold text-primary-600 dark:text-primary-400">PKR 5,000–8,000/mo</td>
                                </tr>
                                <tr className="bg-white dark:bg-neutral-900">
                                    <td className="p-3 font-medium text-neutral-900 dark:text-neutral-100">Full Day Tiffin</td>
                                    <td className="p-3 text-neutral-600 dark:text-neutral-400">Lunch + dinner, 5 or 7 days a week</td>
                                    <td className="p-3 font-semibold text-primary-600 dark:text-primary-400">PKR 9,000–14,000/mo</td>
                                </tr>
                                <tr className="bg-white dark:bg-neutral-900">
                                    <td className="p-3 font-medium text-neutral-900 dark:text-neutral-100">Diet / Health Plan</td>
                                    <td className="p-3 text-neutral-600 dark:text-neutral-400">Low-oil, low-salt, customised meals</td>
                                    <td className="p-3 font-semibold text-primary-600 dark:text-primary-400">Varies by kitchen</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* How to Order */}
                <section>
                    <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">
                        How to Order Tiffin in {cityName}
                    </h3>
                    <ol className="space-y-3 text-neutral-600 dark:text-neutral-400">
                        <li className="flex gap-3">
                            <span className="flex-shrink-0 h-7 w-7 rounded-full bg-primary-500 text-white flex items-center justify-center text-sm font-bold">1</span>
                            <span><strong className="text-neutral-800 dark:text-neutral-200">Browse kitchens above</strong> — filter by area or cuisine type to find a cook near you in {cityName}.</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="flex-shrink-0 h-7 w-7 rounded-full bg-primary-500 text-white flex items-center justify-center text-sm font-bold">2</span>
                            <span><strong className="text-neutral-800 dark:text-neutral-200">View the kitchen profile</strong> — check the daily menu, pricing, delivery areas, and customer reviews.</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="flex-shrink-0 h-7 w-7 rounded-full bg-primary-500 text-white flex items-center justify-center text-sm font-bold">3</span>
                            <span><strong className="text-neutral-800 dark:text-neutral-200">Click WhatsApp button</strong> — chat directly with the cook. Share your address, preferred meal time, and any dietary needs.</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="flex-shrink-0 h-7 w-7 rounded-full bg-primary-500 text-white flex items-center justify-center text-sm font-bold">4</span>
                            <span><strong className="text-neutral-800 dark:text-neutral-200">Confirm and pay</strong> — pay via Cash on Delivery, EasyPaisa, or JazzCash. No advance payment usually required.</span>
                        </li>
                        <li className="flex gap-3">
                            <span className="flex-shrink-0 h-7 w-7 rounded-full bg-primary-500 text-white flex items-center justify-center text-sm font-bold">5</span>
                            <span><strong className="text-neutral-800 dark:text-neutral-200">Enjoy fresh home food</strong> — hot, freshly cooked ghar ka khana delivered to your door in {cityName}.</span>
                        </li>
                    </ol>
                </section>

                {/* FAQ */}
                <section>
                    <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">
                        Frequently Asked Questions — Tiffin Service in {cityName}
                    </h3>
                    <div className="space-y-4">
                        {[
                            {
                                q: `Is tiffin service available in all areas of ${cityName}?`,
                                a: `Most Smart Tiffin home cooks in ${cityName} deliver within a 3–5 km radius. Popular areas like ${neighborhoods.slice(0, 3).join(", ")} typically have multiple options. Contact a cook via WhatsApp to confirm delivery to your exact area.`,
                            },
                            {
                                q: `What is the minimum order for tiffin in ${cityName}?`,
                                a: `Most home cooks have no minimum order — you can order a single meal for PKR ${meta.priceFrom}–350. Some cooks offer better rates for weekly or monthly subscriptions.`,
                            },
                            {
                                q: `Can I customise my tiffin meal in ${cityName}?`,
                                a: `Yes. Because you order directly via WhatsApp, you can request customisations like "less oil", "no onion", "extra roti", or "diabetic-friendly". Home cooks are generally very flexible.`,
                            },
                            {
                                q: `How do I pay for tiffin in ${cityName}?`,
                                a: `Payment options vary by cook but most accept Cash on Delivery, EasyPaisa, JazzCash, and bank transfer. Confirm payment method with the cook before your first order.`,
                            },
                            {
                                q: `Are Smart Tiffin home cooks in ${cityName} verified?`,
                                a: `Some cooks carry a Verified badge, which means they have completed CNIC verification and a kitchen inspection. All cooks — verified or not — have visible customer ratings and reviews.`,
                            },
                        ].map(({ q, a }) => (
                            <details key={q} className="group bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700">
                                <summary className="flex cursor-pointer items-center justify-between p-5 font-semibold text-neutral-900 dark:text-neutral-100 marker:content-none">
                                    {q}
                                    <span className="ml-4 flex-shrink-0 transition-transform group-open:-rotate-180">
                                        <svg className="h-5 w-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </span>
                                </summary>
                                <div className="px-5 pb-5 text-neutral-600 dark:text-neutral-400 leading-relaxed">{a}</div>
                            </details>
                        ))}
                    </div>
                </section>

                {/* Internal Links */}
                <section className="bg-neutral-50 dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800">
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-3">
                        Explore More Cities
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {Object.entries(CITY_META)
                            .filter(([slug]) => slug !== city.toLowerCase())
                            .map(([slug, m]) => (
                                <Link
                                    key={slug}
                                    href={`/city/${slug}`}
                                    className="rounded-full px-4 py-1.5 text-sm font-medium bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:border-primary-400 hover:text-primary-600 transition-all"
                                >
                                    Tiffin in {m.displayName}
                                </Link>
                            ))}
                    </div>
                </section>

                {/* Schema.org LocalBusiness structured data */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "LocalBusiness",
                            "name": `Smart Tiffin ${cityName}`,
                            "description": meta.description,
                            "url": `${BASE_URL}/city/${city.toLowerCase()}`,
                            "areaServed": {
                                "@type": "City",
                                "name": cityName,
                                "addressCountry": "PK",
                            },
                            "priceRange": `PKR ${meta.priceFrom}–500`,
                            "servesCuisine": ["Pakistani", "Desi", "Home-cooked"],
                            "openingHours": "Mo-Fr 08:00-22:00",
                            "telephone": "",
                            "sameAs": [`${BASE_URL}`],
                        }),
                    }}
                />
            </div>
        </article>
    );
}

// ── Page Component ─────────────────────────────────────────────────────────────
export default async function CityPage({ params }: Props) {
    const { city } = await params;
    const cityKey = city.toLowerCase();
    const meta = CITY_META[cityKey] ?? {
        displayName: city.charAt(0).toUpperCase() + city.slice(1),
        tagline: "Pakistan",
        description: `Find daily tiffin service in ${city}.`,
        neighborhoods: [],
        area: city,
        priceFrom: 200,
        slug: `tiffin-service-${city}`,
    };

    // ── BLOCKING fetch — no Suspense, Googlebot sees real kitchen names ──────
    const kitchens = await fetchCityKitchens(meta.displayName);

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

            {/* Breadcrumb — structured navigation */}
            <nav aria-label="Breadcrumb" className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
                <ol className="flex items-center gap-1" itemScope itemType="https://schema.org/BreadcrumbList">
                    <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                        <Link href="/" className="hover:text-primary-600 transition-colors" itemProp="item">
                            <span itemProp="name">Home</span>
                        </Link>
                        <meta itemProp="position" content="1" />
                    </li>
                    <span className="mx-2">/</span>
                    <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                        <Link href="/explore" className="hover:text-primary-600 transition-colors" itemProp="item">
                            <span itemProp="name">Explore</span>
                        </Link>
                        <meta itemProp="position" content="2" />
                    </li>
                    <span className="mx-2">/</span>
                    <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
                        <span className="text-neutral-900 font-medium dark:text-neutral-100" itemProp="name">
                            {meta.displayName}
                        </span>
                        <meta itemProp="position" content="3" />
                    </li>
                </ol>
            </nav>

            {/* Page Header */}
            <div className="mb-8">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400 mb-1">
                    {meta.tagline}
                </p>
                <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 sm:text-4xl">
                    Tiffin Service in {meta.displayName}
                </h1>
                <p className="mt-3 text-neutral-500 dark:text-neutral-400 max-w-2xl">
                    Browse verified home cooks offering fresh daily tiffin in {meta.displayName}.
                    Order directly via WhatsApp from PKR {meta.priceFrom}.
                </p>
            </div>

            {/* Search Bar */}
            <div className="mb-8">
                <SearchBar initialCity={meta.displayName} compact />
            </div>

            {/* Kitchen Grid — BLOCKING SSR, no Suspense shimmer */}
            {kitchens.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {kitchens.map((k: Record<string, unknown>) => (
                        <KitchenCard
                            key={k.id as string}
                            id={k.id as string}
                            name={k.name as string}
                            city={k.city as string}
                            area={k.area as string | null}
                            rating={Number(k.avgRating) || 0}
                            totalReviews={Number(k.totalReviews) || 0}
                            imageUrl={k.coverImage as string | null}
                            cuisineType={k.cuisineType as string[] | null}
                            priceRange={k.priceRange as string | null}
                            isVerified={k.isVerified as boolean}
                            isBoosted={(Number(k.boostPriority) || 0) > 0}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 bg-neutral-50 dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800">
                    <span className="text-5xl block mb-4">🏙️</span>
                    <h3 className="text-lg font-semibold text-neutral-700 dark:text-neutral-300">
                        No kitchens listed yet in {meta.displayName}
                    </h3>
                    <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400 mb-6">
                        Be the first home cook to register your kitchen in {meta.displayName}!
                    </p>
                    <Link
                        href="/become-a-cook"
                        className="inline-block rounded-xl bg-primary-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-600 transition-all"
                    >
                        Register as a Home Cook
                    </Link>
                </div>
            )}

            {/* CTA */}
            <div className="mt-10 p-6 bg-primary-50 dark:bg-primary-900/20 rounded-2xl border border-primary-100 dark:border-primary-800 flex flex-col sm:flex-row items-center gap-4">
                <div className="flex-1">
                    <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                        Are you a home cook in {meta.displayName}?
                    </p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                        List your kitchen for free and start receiving orders via WhatsApp.
                    </p>
                </div>
                <Link
                    href="/become-a-cook"
                    className="flex-shrink-0 rounded-xl bg-primary-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-600 transition-all"
                >
                    List Your Kitchen →
                </Link>
            </div>

            {/* SEO Article Content (800+ words, city-specific) */}
            <CitySEOSection city={city} meta={meta} />
        </div>
    );
}
