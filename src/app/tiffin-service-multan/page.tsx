import type { Metadata } from "next";
import Link from "next/link";
import { BASE_URL } from "@/config/site";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildFAQSchema, buildBreadcrumbSchema } from "@/lib/seo/schemas";

export const metadata: Metadata = {
    title: "Tiffin Service in Multan – Fresh Home Cooked Meals from PKR 180 | Smart Tiffin",
    description: "Looking for tiffin service in Multan? Get fresh daily ghar ka khana from verified home cooks in Cantt, Gulgasht Colony, Bosan Road. Order via WhatsApp from PKR 180.",
    robots: {
        index: true,
        follow: true,
        googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
    },
    alternates: {
        canonical: `${BASE_URL}/tiffin-service-multan`,
    },
    openGraph: {
        title: "Tiffin Service in Multan | Smart Tiffin",
        description: "Fresh daily home-cooked meals in Multan from trusted home cooks. Starting from PKR 180.",
        url: `${BASE_URL}/tiffin-service-multan`,
        siteName: "Smart Tiffin",
        locale: "en_PK",
        type: "website",
        images: [{ url: `${BASE_URL}/api/og?city=Multan`, width: 1200, height: 630, alt: "Tiffin Service in Multan – Smart Tiffin" }],
    },
    twitter: {
        card: "summary_large_image",
        title: "Tiffin Service in Multan | Smart Tiffin",
        description: "Fresh daily home-cooked meals in Multan from trusted home cooks. Starting from PKR 180.",
        images: [`${BASE_URL}/api/og?city=Multan`],
    },
};

const MULTAN_AREAS = ["Cantt", "Shah Rukn-e-Alam", "Bohar Gate", "Vehari Road", "Bosan Road", "DHA Multan", "Gulgasht Colony"];

const MULTAN_FAQ = [
    {
        q: "What is the cost of tiffin service in Multan?",
        a: "Tiffin service in Multan ranges from PKR 180–300 per single meal. Monthly plans range from PKR 4,500–6,000 depending on the location and meal plan.",
    },
    {
        q: "Which areas in Multan have tiffin delivery available?",
        a: "Home cooks on Smart Tiffin cover major areas including Cantt, Gulgasht Colony, Bosan Road, and DHA Multan. Contact any cook via WhatsApp to confirm delivery.",
    },
    {
        q: "Can I get tiffin delivery for my office?",
        a: "Yes. Several Smart Tiffin cooks in Multan specifically offer office tiffin delivery. Most offer Mon–Fri lunch subscriptions.",
    }
];

export default function TiffinServiceMultanPage() {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": "Smart Tiffin Multan",
        "description": "Pakistan's home food marketplace connecting Multan residents with local home cooks offering daily tiffin service.",
        "url": `${BASE_URL}/tiffin-service-multan`,
        "areaServed": { "@type": "City", "name": "Multan", "addressCountry": "PK" },
        "priceRange": "PKR 180–400",
        "servesCuisine": ["Pakistani", "Seraiki", "Desi", "Home-cooked"],
        "openingHours": "Mo-Fr 07:00-22:00",
    };

    return (
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            <JsonLd schema={buildFAQSchema(MULTAN_FAQ.map(f => ({ question: f.q, answer: f.a })))} />
            <JsonLd schema={buildBreadcrumbSchema([
                { name: 'Home', url: BASE_URL },
                { name: 'Multan', url: `${BASE_URL}/city/multan` },
                { name: 'Tiffin Service Multan', url: `${BASE_URL}/tiffin-service-multan` }
            ])} />

            {/* Breadcrumb */}
            <nav className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
                <Link href="/" className="hover:text-primary-600">Home</Link>
                <span className="mx-2">/</span>
                <Link href="/city/multan" className="hover:text-primary-600">Multan</Link>
                <span className="mx-2">/</span>
                <span className="text-neutral-800 dark:text-neutral-200 font-medium">Tiffin Service</span>
            </nav>

            {/* Hero */}
            <div className="mb-12">
                <span className="inline-block rounded-full bg-primary-100 dark:bg-primary-900/30 px-3 py-1 text-xs font-semibold text-primary-700 dark:text-primary-300 mb-3">
                    🕌 Multan's Home Food Platform
                </span>
                <h1 className="text-4xl font-extrabold text-neutral-900 dark:text-neutral-50 sm:text-5xl leading-tight">
                    Tiffin Service in Multan
                </h1>
                <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-400 max-w-3xl leading-relaxed">
                    Get fresh daily tiffin service in Multan from trusted home cooks. Authentic <em>ghar ka khana</em> —
                    daal, karahi, biryani, roti — delivered across Cantt, Bosan Road & Gulgasht Colony.
                    Starting from <strong>PKR 180</strong>. Order directly via WhatsApp.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                    <Link href="/city/multan" className="inline-block rounded-xl bg-primary-500 px-6 py-3 text-sm font-bold text-white hover:bg-primary-600 transition-all shadow-lg">
                        Browse Multan Kitchens →
                    </Link>
                    <Link href="/become-a-cook" className="inline-block rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 px-6 py-3 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:border-primary-400 transition-all">
                        List Your Kitchen
                    </Link>
                </div>
            </div>

            {/* Delivery Areas */}
            <section className="mb-12">
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
                    Tiffin Delivery Areas in Multan
                </h2>
                <div className="flex flex-wrap gap-2 mb-4">
                    {MULTAN_AREAS.map((area) => (
                        <span key={area} className="rounded-full bg-primary-50 dark:bg-primary-900/20 px-3 py-1 text-sm font-medium text-primary-700 dark:text-primary-300 border border-primary-100 dark:border-primary-800">
                            {area}
                        </span>
                    ))}
                </div>
            </section>

            {/* FAQ */}
            <section className="mb-12">
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">
                    Frequently Asked Questions — Tiffin Service Multan
                </h2>
                <div className="space-y-4">
                    {MULTAN_FAQ.map(({ q, a }) => (
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
                <h2 className="text-2xl font-bold mb-2">Ready to Order Tiffin in Multan?</h2>
                <p className="text-primary-100 mb-6">Browse home cooks in your area and order via WhatsApp today.</p>
                <Link href="/city/multan" className="inline-block rounded-xl bg-white px-8 py-3 text-sm font-bold text-primary-600 hover:bg-primary-50 transition-all shadow-lg">
                    Browse Multan Kitchens →
                </Link>
            </div>
        </div>
    );
}
