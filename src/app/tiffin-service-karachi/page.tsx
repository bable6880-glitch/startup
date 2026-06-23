import type { Metadata } from "next";
import Link from "next/link";
import { BASE_URL } from "@/config/site";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildFAQSchema, buildBreadcrumbSchema } from "@/lib/seo/schemas";

export const metadata: Metadata = {
    title: "Tiffin Service in Karachi – Fresh Home Cooked Meals from PKR 220 | Smart Tiffin",
    description: "Find trusted tiffin service in Karachi from verified home cooks. Fresh daily ghar ka khana delivered to Clifton, DHA, Gulshan, North Nazimabad & across Karachi. Order via WhatsApp from PKR 220.",
    robots: {
        index: true,
        follow: true,
        googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
    },
    alternates: {
        canonical: `${BASE_URL}/tiffin-service-karachi`,
    },
    openGraph: {
        title: "Tiffin Service in Karachi | Smart Tiffin",
        description: "Fresh daily home-cooked meals in Karachi from trusted home cooks. Starting from PKR 220.",
        url: `${BASE_URL}/tiffin-service-karachi`,
        siteName: "Smart Tiffin",
        locale: "en_PK",
        type: "website",
        images: [{ url: `${BASE_URL}/api/og?city=Karachi`, width: 1200, height: 630, alt: "Tiffin Service in Karachi – Smart Tiffin" }],
    },
    twitter: {
        card: "summary_large_image",
        title: "Tiffin Service in Karachi | Smart Tiffin",
        description: "Fresh daily home-cooked meals in Karachi from trusted home cooks. Starting from PKR 220.",
        images: [`${BASE_URL}/api/og?city=Karachi`],
    },
};

const KARACHI_AREAS = ["Clifton", "DHA", "Gulshan-e-Iqbal", "North Nazimabad", "PECHS", "Saddar", "Korangi", "Malir", "Bahria Town", "Scheme 33", "Nazimabad", "Liaquatabad", "Gulistan-e-Johar", "Landhi", "Defense View"];

const KARACHI_FAQ = [
    {
        q: "What is the average cost of tiffin service in Karachi?",
        a: "Tiffin service in Karachi typically costs PKR 220–350 for a single meal. Monthly lunch plans range from PKR 4,500–7,000 depending on your area (Clifton and DHA tend to be slightly higher than Gulshan and North Nazimabad).",
    },
    {
        q: "Which areas of Karachi have home tiffin delivery?",
        a: "Home cooks on Smart Tiffin cover most Karachi areas including Clifton, DHA (all phases), Gulshan-e-Iqbal, North Nazimabad, PECHS, Saddar, Korangi, Malir, Bahria Town, Scheme 33, Gulistan-e-Johar, and Nazimabad. Contact a cook via WhatsApp to confirm delivery to your address.",
    },
    {
        q: "Is there Sindhi food available in Karachi tiffin services?",
        a: "Yes! Many Karachi home cooks on Smart Tiffin offer traditional Sindhi dishes like Sindhi Biryani, Sai Bhaji, Kachri Gosht, and Daal Chawal alongside standard Pakistani tiffin menus.",
    },
    {
        q: "Can I get halal-certified tiffin in Karachi?",
        a: "All Smart Tiffin home cooks in Karachi prepare halal food as per standard Pakistani dietary practices. You can confirm specific halal certification requirements by messaging the cook directly.",
    },
    {
        q: "How do I find the best tiffin service near me in Karachi?",
        a: "Visit our Karachi kitchens page, select your neighbourhood using the city filter, and compare cooks by ratings, distance, menu, and price. Most top-rated Karachi cooks have verified reviews from regular customers.",
    },
];

export default function TiffinServiceKarachiPage() {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": "Smart Tiffin Karachi",
        "description": "Pakistan's home food marketplace connecting Karachi residents with local home cooks offering daily tiffin service.",
        "url": `${BASE_URL}/tiffin-service-karachi`,
        "areaServed": { "@type": "City", "name": "Karachi", "addressCountry": "PK" },
        "priceRange": "PKR 220–500",
        "servesCuisine": ["Pakistani", "Sindhi", "Desi", "Home-cooked"],
        "openingHours": "Mo-Fr 07:00-22:00",
    };

    return (
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            <JsonLd schema={buildFAQSchema(KARACHI_FAQ.map(f => ({ question: f.q, answer: f.a })))} />
            <JsonLd schema={buildBreadcrumbSchema([
                { name: 'Home', url: BASE_URL },
                { name: 'Karachi', url: `${BASE_URL}/city/karachi` },
                { name: 'Tiffin Service Karachi', url: `${BASE_URL}/tiffin-service-karachi` }
            ])} />

            {/* Breadcrumb */}
            <nav className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
                <Link href="/" className="hover:text-primary-600">Home</Link>
                <span className="mx-2">/</span>
                <Link href="/city/karachi" className="hover:text-primary-600">Karachi</Link>
                <span className="mx-2">/</span>
                <span className="text-neutral-800 dark:text-neutral-200 font-medium">Tiffin Service</span>
            </nav>

            {/* Hero */}
            <div className="mb-12">
                <span className="inline-block rounded-full bg-primary-100 dark:bg-primary-900/30 px-3 py-1 text-xs font-semibold text-primary-700 dark:text-primary-300 mb-3">
                    🌊 Karachi's Home Food Platform
                </span>
                <h1 className="text-4xl font-extrabold text-neutral-900 dark:text-neutral-50 sm:text-5xl leading-tight">
                    Tiffin Service in Karachi
                </h1>
                <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-400 max-w-3xl leading-relaxed">
                    Order affordable daily tiffin service in Karachi from verified home cooks. Fresh <em>ghar ka khana</em> —
                    biryani, karahi, daal, roti — delivered to Clifton, DHA, Gulshan, North Nazimabad & all Karachi
                    neighbourhoods. Starting from <strong>PKR 220</strong>. No app needed, just WhatsApp.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                        href="/city/karachi"
                        className="inline-block rounded-xl bg-primary-500 px-6 py-3 text-sm font-bold text-white hover:bg-primary-600 transition-all shadow-lg"
                    >
                        Browse Karachi Home Kitchens →
                    </Link>
                    <Link
                        href="/become-a-cook"
                        className="inline-block rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 px-6 py-3 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:border-primary-400 transition-all"
                    >
                        List Your Kitchen
                    </Link>
                </div>
            </div>

            {/* Introduction */}
            <section className="mb-12">
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
                    Home Tiffin Service in Karachi — Ghar Ka Khana at Your Doorstep
                </h2>
                <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
                    Karachi is Pakistan's largest city and business hub, with millions of working professionals
                    and students who need reliable, affordable daily meals. Restaurant food in Karachi has become
                    increasingly expensive and often unhealthy. Smart Tiffin offers a better alternative: fresh,
                    home-cooked meals prepared by trusted local home cooks across Karachi — at a fraction of
                    the restaurant cost.
                </p>
                <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
                    Our Karachi home cooks include experienced housewives, retired chefs, and passionate home
                    cooks who bring authentic Pakistani and Sindhi flavors to your door. From the rich Sindhi
                    biryani of Korangi to the classic Lahori-style karahi in Clifton — Smart Tiffin Karachi
                    has something for every palate and every budget.
                </p>
                <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    Unlike food delivery apps that take 25–30% commission from cooks (and pass that cost to
                    you), Smart Tiffin is commission-free. You pay the cook directly, and both parties benefit.
                </p>
            </section>

            {/* Delivery Areas */}
            <section className="mb-12">
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
                    Tiffin Delivery Areas in Karachi
                </h2>
                <div className="flex flex-wrap gap-2 mb-4">
                    {KARACHI_AREAS.map((area) => (
                        <span key={area} className="rounded-full bg-primary-50 dark:bg-primary-900/20 px-3 py-1 text-sm font-medium text-primary-700 dark:text-primary-300 border border-primary-100 dark:border-primary-800">
                            {area}
                        </span>
                    ))}
                </div>
            </section>

            {/* Pricing */}
            <section className="mb-12">
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
                    Tiffin Service Prices in Karachi (2025)
                </h2>
                <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm mb-4">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-neutral-50 dark:bg-neutral-800">
                            <tr>
                                <th className="p-3 font-semibold text-neutral-900 dark:text-neutral-100">Plan</th>
                                <th className="p-3 font-semibold text-neutral-900 dark:text-neutral-100">Clifton / DHA</th>
                                <th className="p-3 font-semibold text-neutral-900 dark:text-neutral-100">Gulshan / PECHS</th>
                                <th className="p-3 font-semibold text-neutral-900 dark:text-neutral-100">North Nazimabad / Saddar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                            <tr className="bg-white dark:bg-neutral-900">
                                <td className="p-3 font-medium text-neutral-900 dark:text-neutral-100">Single Meal</td>
                                <td className="p-3 text-neutral-600 dark:text-neutral-400">PKR 260–330</td>
                                <td className="p-3 text-neutral-600 dark:text-neutral-400">PKR 240–300</td>
                                <td className="p-3 text-neutral-600 dark:text-neutral-400">PKR 220–280</td>
                            </tr>
                            <tr className="bg-white dark:bg-neutral-900">
                                <td className="p-3 font-medium text-neutral-900 dark:text-neutral-100">Weekly Lunch (5 days)</td>
                                <td className="p-3 text-neutral-600 dark:text-neutral-400">PKR 1,200–1,500</td>
                                <td className="p-3 text-neutral-600 dark:text-neutral-400">PKR 1,100–1,350</td>
                                <td className="p-3 text-neutral-600 dark:text-neutral-400">PKR 1,000–1,200</td>
                            </tr>
                            <tr className="bg-white dark:bg-neutral-900">
                                <td className="p-3 font-medium text-neutral-900 dark:text-neutral-100">Monthly Lunch Plan</td>
                                <td className="p-3 text-primary-600 dark:text-primary-400 font-semibold">PKR 5,000–7,000</td>
                                <td className="p-3 text-primary-600 dark:text-primary-400 font-semibold">PKR 4,500–6,000</td>
                                <td className="p-3 text-primary-600 dark:text-primary-400 font-semibold">PKR 4,000–5,500</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            {/* FAQ */}
            <section className="mb-12">
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">
                    Frequently Asked Questions — Tiffin Service Karachi
                </h2>
                <div className="space-y-4">
                    {KARACHI_FAQ.map(({ q, a }) => (
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
                <h2 className="text-2xl font-bold mb-2">Ready to Order Tiffin in Karachi?</h2>
                <p className="text-primary-100 mb-6">Find a home cook near you and order via WhatsApp in minutes.</p>
                <Link
                    href="/city/karachi"
                    className="inline-block rounded-xl bg-white px-8 py-3 text-sm font-bold text-primary-600 hover:bg-primary-50 transition-all shadow-lg"
                >
                    Browse Karachi Kitchens →
                </Link>
            </div>

            {/* Internal Links */}
            <section>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-3">Tiffin Service in Other Cities</h3>
                <div className="flex flex-wrap gap-2">
                    {[["lahore", "Lahore"], ["islamabad", "Islamabad"], ["rawalpindi", "Rawalpindi"], ["faisalabad", "Faisalabad"], ["multan", "Multan"]].map(([slug, name]) => (
                        <Link key={slug} href={`/tiffin-service-${slug}`} className="rounded-full px-4 py-1.5 text-sm font-medium bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:border-primary-400 hover:text-primary-600 transition-all">
                            Tiffin in {name}
                        </Link>
                    ))}
                </div>
            </section>
        </div>
    );
}
