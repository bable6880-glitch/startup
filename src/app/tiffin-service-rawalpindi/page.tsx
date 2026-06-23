import type { Metadata } from "next";
import Link from "next/link";
import { BASE_URL } from "@/config/site";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildFAQSchema, buildBreadcrumbSchema } from "@/lib/seo/schemas";

export const metadata: Metadata = {
    title: "Tiffin Service in Rawalpindi – Fresh Home Cooked Meals from PKR 200 | Smart Tiffin",
    description: "Looking for tiffin service in Rawalpindi? Get fresh daily ghar ka khana from verified home cooks in Saddar, Bahria Town, Chaklala & more. Order via WhatsApp from PKR 200.",
    robots: {
        index: true,
        follow: true,
        googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
    },
    alternates: {
        canonical: `${BASE_URL}/tiffin-service-rawalpindi`,
    },
    openGraph: {
        title: "Tiffin Service in Rawalpindi | Smart Tiffin",
        description: "Fresh daily home-cooked meals in Rawalpindi from trusted home cooks. Starting from PKR 200.",
        url: `${BASE_URL}/tiffin-service-rawalpindi`,
        siteName: "Smart Tiffin",
        locale: "en_PK",
        type: "website",
        images: [{ url: `${BASE_URL}/api/og?city=Rawalpindi`, width: 1200, height: 630, alt: "Tiffin Service in Rawalpindi – Smart Tiffin" }],
    },
    twitter: {
        card: "summary_large_image",
        title: "Tiffin Service in Rawalpindi | Smart Tiffin",
        description: "Fresh daily home-cooked meals in Rawalpindi from trusted home cooks. Starting from PKR 200.",
        images: [`${BASE_URL}/api/og?city=Rawalpindi`],
    },
};

const RAWALPINDI_AREAS = ["Saddar", "Westridge", "Bahria Town", "Gulrez", "Chaklala", "Committee Chowk", "Satellite Town", "Cantt"];

const RAWALPINDI_FAQ = [
    {
        q: "What is the cost of tiffin service in Rawalpindi?",
        a: "Tiffin service in Rawalpindi ranges from PKR 200–350 per single meal. Monthly plans range from PKR 5,000–7,000 depending on the location and meal plan.",
    },
    {
        q: "Which areas in Rawalpindi have tiffin delivery available?",
        a: "Home cooks on Smart Tiffin cover major areas including Saddar, Westridge, Bahria Town, Gulrez, Chaklala, Committee Chowk, Satellite Town, and Cantt. Contact any cook via WhatsApp to confirm delivery to your specific address.",
    },
    {
        q: "Can I get tiffin delivery for my office in Saddar?",
        a: "Yes. Several Smart Tiffin cooks in Rawalpindi specifically offer office tiffin delivery to Saddar and surrounding commercial areas. Most offer Mon–Fri lunch subscriptions.",
    },
    {
        q: "How does tiffin delivery work in Bahria Town Rawalpindi?",
        a: "Many Smart Tiffin cooks serve Bahria Town Rawalpindi. Some cooks live within these communities and deliver within walking distance, while others cover the area via motorcycle. Confirm delivery cost and timing via WhatsApp before ordering.",
    }
];

export default function TiffinServiceRawalpindiPage() {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": "Smart Tiffin Rawalpindi",
        "description": "Pakistan's home food marketplace connecting Rawalpindi residents with local home cooks offering daily tiffin service.",
        "url": `${BASE_URL}/tiffin-service-rawalpindi`,
        "areaServed": { "@type": "City", "name": "Rawalpindi", "addressCountry": "PK" },
        "priceRange": "PKR 200–500",
        "servesCuisine": ["Pakistani", "Desi", "Home-cooked"],
        "openingHours": "Mo-Fr 07:00-22:00",
    };

    return (
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            <JsonLd schema={buildFAQSchema(RAWALPINDI_FAQ.map(f => ({ question: f.q, answer: f.a })))} />
            <JsonLd schema={buildBreadcrumbSchema([
                { name: 'Home', url: BASE_URL },
                { name: 'Rawalpindi', url: `${BASE_URL}/city/rawalpindi` },
                { name: 'Tiffin Service Rawalpindi', url: `${BASE_URL}/tiffin-service-rawalpindi` }
            ])} />

            {/* Breadcrumb */}
            <nav className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
                <Link href="/" className="hover:text-primary-600">Home</Link>
                <span className="mx-2">/</span>
                <Link href="/city/rawalpindi" className="hover:text-primary-600">Rawalpindi</Link>
                <span className="mx-2">/</span>
                <span className="text-neutral-800 dark:text-neutral-200 font-medium">Tiffin Service</span>
            </nav>

            {/* Hero */}
            <div className="mb-12">
                <span className="inline-block rounded-full bg-primary-100 dark:bg-primary-900/30 px-3 py-1 text-xs font-semibold text-primary-700 dark:text-primary-300 mb-3">
                    🏙️ Rawalpindi's Home Food Platform
                </span>
                <h1 className="text-4xl font-extrabold text-neutral-900 dark:text-neutral-50 sm:text-5xl leading-tight">
                    Tiffin Service in Rawalpindi
                </h1>
                <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-400 max-w-3xl leading-relaxed">
                    Get fresh daily tiffin service in Rawalpindi from trusted home cooks. Authentic <em>ghar ka khana</em> —
                    daal, karahi, biryani, roti — delivered across Saddar, Bahria Town & Chaklala.
                    Starting from <strong>PKR 200</strong>. Order directly via WhatsApp.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                    <Link href="/city/rawalpindi" className="inline-block rounded-xl bg-primary-500 px-6 py-3 text-sm font-bold text-white hover:bg-primary-600 transition-all shadow-lg">
                        Browse Rawalpindi Kitchens →
                    </Link>
                    <Link href="/become-a-cook" className="inline-block rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 px-6 py-3 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:border-primary-400 transition-all">
                        List Your Kitchen
                    </Link>
                </div>
            </div>

            {/* Introduction */}
            <section className="mb-12">
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
                    Daily Home Tiffin in Rawalpindi — Fresh Meals for Students & Professionals
                </h2>
                <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
                    Rawalpindi is a bustling city with a large population of students, professionals, and families. 
                    Smart Tiffin connects you directly with home cooks in your area who prepare fresh daily meals — 
                    the kind of food you'd find at a Pakistani family dinner table.
                </p>
                <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
                    With restaurant prices rising, home tiffin services offer a dramatically more affordable and healthier 
                    alternative. Our Rawalpindi home cooks serve fresh meals with less oil, no artificial colours, 
                    and real family recipes.
                </p>
            </section>

            {/* Delivery Areas */}
            <section className="mb-12">
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
                    Tiffin Delivery Areas in Rawalpindi
                </h2>
                <div className="flex flex-wrap gap-2 mb-4">
                    {RAWALPINDI_AREAS.map((area) => (
                        <span key={area} className="rounded-full bg-primary-50 dark:bg-primary-900/20 px-3 py-1 text-sm font-medium text-primary-700 dark:text-primary-300 border border-primary-100 dark:border-primary-800">
                            {area}
                        </span>
                    ))}
                </div>
            </section>

            {/* Pricing */}
            <section className="mb-12">
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
                    Tiffin Service Prices in Rawalpindi (2025)
                </h2>
                <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm mb-4">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-neutral-50 dark:bg-neutral-800">
                            <tr>
                                <th className="p-3 font-semibold text-neutral-900 dark:text-neutral-100">Plan</th>
                                <th className="p-3 font-semibold text-neutral-900 dark:text-neutral-100">Price Range</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                            <tr className="bg-white dark:bg-neutral-900">
                                <td className="p-3 font-medium text-neutral-900 dark:text-neutral-100">Single Meal</td>
                                <td className="p-3 text-neutral-600 dark:text-neutral-400">PKR 200–350</td>
                            </tr>
                            <tr className="bg-white dark:bg-neutral-900">
                                <td className="p-3 font-medium text-neutral-900 dark:text-neutral-100">Weekly Lunch (5 days)</td>
                                <td className="p-3 text-neutral-600 dark:text-neutral-400">PKR 1,000–1,500</td>
                            </tr>
                            <tr className="bg-white dark:bg-neutral-900">
                                <td className="p-3 font-medium text-neutral-900 dark:text-neutral-100">Monthly Lunch Plan</td>
                                <td className="p-3 text-primary-600 dark:text-primary-400 font-semibold">PKR 5,000–7,000</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            {/* FAQ */}
            <section className="mb-12">
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">
                    Frequently Asked Questions — Tiffin Service Rawalpindi
                </h2>
                <div className="space-y-4">
                    {RAWALPINDI_FAQ.map(({ q, a }) => (
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

            {/* CTA */}
            <div className="rounded-2xl bg-gradient-to-r from-primary-500 to-primary-600 p-8 text-center text-white mb-12">
                <h2 className="text-2xl font-bold mb-2">Ready to Order Tiffin in Rawalpindi?</h2>
                <p className="text-primary-100 mb-6">Browse home cooks in your area and order via WhatsApp today.</p>
                <Link href="/city/rawalpindi" className="inline-block rounded-xl bg-white px-8 py-3 text-sm font-bold text-primary-600 hover:bg-primary-50 transition-all shadow-lg">
                    Browse Rawalpindi Kitchens →
                </Link>
            </div>

            {/* Internal Links */}
            <section>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-3">Tiffin Service in Other Cities</h3>
                <div className="flex flex-wrap gap-2">
                    {[["lahore", "Lahore"], ["islamabad", "Islamabad"], ["karachi", "Karachi"], ["faisalabad", "Faisalabad"], ["multan", "Multan"]].map(([slug, name]) => (
                        <Link key={slug} href={`/tiffin-service-${slug}`} className="rounded-full px-4 py-1.5 text-sm font-medium bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:border-primary-400 hover:text-primary-600 transition-all">
                            Tiffin in {name}
                        </Link>
                    ))}
                </div>
            </section>
        </div>
    );
}
