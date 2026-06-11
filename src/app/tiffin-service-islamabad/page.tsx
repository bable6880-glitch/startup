import type { Metadata } from "next";
import Link from "next/link";
import { BASE_URL } from "@/config/site";

export const metadata: Metadata = {
    title: "Tiffin Service in Islamabad – Fresh Home Cooked Meals from PKR 250 | Smart Tiffin",
    description: "Looking for tiffin service in Islamabad? Get fresh daily ghar ka khana from verified home cooks in F-sectors, G-sectors, Bahria Town & DHA Islamabad. Order via WhatsApp from PKR 250.",
    robots: {
        index: true,
        follow: true,
        googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
    },
    alternates: {
        canonical: `${BASE_URL}/tiffin-service-islamabad`,
    },
    openGraph: {
        title: "Tiffin Service in Islamabad | Smart Tiffin",
        description: "Fresh daily home-cooked meals in Islamabad from trusted home cooks. Starting from PKR 250.",
        url: `${BASE_URL}/tiffin-service-islamabad`,
        siteName: "Smart Tiffin",
        locale: "en_PK",
        type: "website",
        images: [{ url: `${BASE_URL}/api/og?city=Islamabad`, width: 1200, height: 630, alt: "Tiffin Service in Islamabad – Smart Tiffin" }],
    },
    twitter: {
        card: "summary_large_image",
        title: "Tiffin Service in Islamabad | Smart Tiffin",
        description: "Fresh daily home-cooked meals in Islamabad from trusted home cooks. Starting from PKR 250.",
        images: [`${BASE_URL}/api/og?city=Islamabad`],
    },
};

const ISLAMABAD_AREAS = ["F-10", "F-11", "F-6", "F-7", "F-8", "G-9", "G-10", "G-11", "I-8", "I-10", "E-7", "E-11", "Bahria Town", "DHA Islamabad", "PWD Colony", "CDA Sectors", "Blue Area", "Margalla Hills area"];

const ISLAMABAD_FAQ = [
    {
        q: "What is the cost of tiffin service in Islamabad?",
        a: "Tiffin service in Islamabad ranges from PKR 250–380 per single meal. Islamabad tends to have slightly higher prices than Lahore due to higher living costs. Monthly plans range from PKR 5,500–8,000 depending on the sector and meal plan.",
    },
    {
        q: "Which sectors in Islamabad have tiffin delivery available?",
        a: "Home cooks on Smart Tiffin cover F-sectors (F-6 to F-11), G-sectors (G-9, G-10, G-11), I-sectors (I-8, I-10), E-sectors (E-7, E-11), Bahria Town Islamabad, DHA Islamabad, and PWD Colony. Contact any cook via WhatsApp to confirm delivery to your specific address.",
    },
    {
        q: "Can I get tiffin delivery for my office in Blue Area Islamabad?",
        a: "Yes. Several Smart Tiffin cooks in Islamabad specifically offer office tiffin delivery to Blue Area, F-6, and F-7 sectors. Most offer Mon–Fri lunch subscriptions with bulk discounts for office orders of 5 or more people.",
    },
    {
        q: "Is there Peshawari or NWFP-style food available in Islamabad tiffins?",
        a: "Yes! Being close to KPK, many Islamabad home cooks offer Peshawari cuisine like Chapli Kebab, Kabuli Pulao, Peshawari Karahi, and Sajji alongside standard Pakistani tiffin fare.",
    },
    {
        q: "How does tiffin delivery work in Bahria Town and DHA Islamabad?",
        a: "Many Smart Tiffin cooks serve Bahria Town and DHA Islamabad. Some cooks live within these communities and deliver within walking distance, while others cover the area via motorcycle. Confirm delivery cost and timing via WhatsApp before ordering.",
    },
];

export default function TiffinServiceIslamabadPage() {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": "Smart Tiffin Islamabad",
        "description": "Pakistan's home food marketplace connecting Islamabad residents with local home cooks offering daily tiffin service.",
        "url": `${BASE_URL}/tiffin-service-islamabad`,
        "areaServed": { "@type": "City", "name": "Islamabad", "addressCountry": "PK" },
        "priceRange": "PKR 250–600",
        "servesCuisine": ["Pakistani", "Peshawari", "Desi", "Home-cooked"],
        "openingHours": "Mo-Fr 07:00-22:00",
    };

    return (
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

            {/* Breadcrumb */}
            <nav className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
                <Link href="/" className="hover:text-primary-600">Home</Link>
                <span className="mx-2">/</span>
                <Link href="/city/islamabad" className="hover:text-primary-600">Islamabad</Link>
                <span className="mx-2">/</span>
                <span className="text-neutral-800 dark:text-neutral-200 font-medium">Tiffin Service</span>
            </nav>

            {/* Hero */}
            <div className="mb-12">
                <span className="inline-block rounded-full bg-primary-100 dark:bg-primary-900/30 px-3 py-1 text-xs font-semibold text-primary-700 dark:text-primary-300 mb-3">
                    🏔️ Islamabad's Home Food Platform
                </span>
                <h1 className="text-4xl font-extrabold text-neutral-900 dark:text-neutral-50 sm:text-5xl leading-tight">
                    Tiffin Service in Islamabad
                </h1>
                <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-400 max-w-3xl leading-relaxed">
                    Get fresh daily tiffin service in Islamabad from trusted home cooks. Authentic <em>ghar ka khana</em> —
                    daal, karahi, biryani, roti — delivered across F-sectors, G-sectors, Bahria Town & DHA Islamabad.
                    Starting from <strong>PKR 250</strong>. Order directly via WhatsApp.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                    <Link href="/city/islamabad" className="inline-block rounded-xl bg-primary-500 px-6 py-3 text-sm font-bold text-white hover:bg-primary-600 transition-all shadow-lg">
                        Browse Islamabad Kitchens →
                    </Link>
                    <Link href="/become-a-cook" className="inline-block rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 px-6 py-3 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:border-primary-400 transition-all">
                        List Your Kitchen
                    </Link>
                </div>
            </div>

            {/* Introduction */}
            <section className="mb-12">
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
                    Daily Home Tiffin in Islamabad — Fresh Meals for Government Employees, Students & Families
                </h2>
                <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
                    Islamabad is Pakistan's capital city, home to government offices, universities, embassies, and
                    a large middle-class population that values clean, healthy, and affordable food. Smart Tiffin
                    Islamabad connects you directly with home cooks in your sector who prepare fresh daily meals
                    — the kind of food you'd find at a Pakistani family dinner table.
                </p>
                <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
                    With Islamabad's notoriously high restaurant prices (a basic meal in F-7 or F-6 can cost
                    PKR 800–1,500), home tiffin services offer a dramatically more affordable and often healthier
                    alternative. Our Islamabad home cooks serve fresh meals with less oil, no artificial colours,
                    and real family recipes.
                </p>
                <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    Many of our Islamabad cooks specialise in serving government employees in CDA sectors,
                    university students in H-sectors, and young professionals in F-10 and F-11. Whatever your
                    location or budget, Smart Tiffin has an Islamabad cook for you.
                </p>
            </section>

            {/* Delivery Areas */}
            <section className="mb-12">
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
                    Tiffin Delivery Areas in Islamabad
                </h2>
                <div className="flex flex-wrap gap-2 mb-4">
                    {ISLAMABAD_AREAS.map((area) => (
                        <span key={area} className="rounded-full bg-primary-50 dark:bg-primary-900/20 px-3 py-1 text-sm font-medium text-primary-700 dark:text-primary-300 border border-primary-100 dark:border-primary-800">
                            {area}
                        </span>
                    ))}
                </div>
            </section>

            {/* Pricing */}
            <section className="mb-12">
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
                    Tiffin Service Prices in Islamabad (2025)
                </h2>
                <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm mb-4">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-neutral-50 dark:bg-neutral-800">
                            <tr>
                                <th className="p-3 font-semibold text-neutral-900 dark:text-neutral-100">Plan</th>
                                <th className="p-3 font-semibold text-neutral-900 dark:text-neutral-100">F-6, F-7, E-7</th>
                                <th className="p-3 font-semibold text-neutral-900 dark:text-neutral-100">F-10, F-11, G-11</th>
                                <th className="p-3 font-semibold text-neutral-900 dark:text-neutral-100">I-8, G-9, I-10</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                            <tr className="bg-white dark:bg-neutral-900">
                                <td className="p-3 font-medium text-neutral-900 dark:text-neutral-100">Single Meal</td>
                                <td className="p-3 text-neutral-600 dark:text-neutral-400">PKR 300–380</td>
                                <td className="p-3 text-neutral-600 dark:text-neutral-400">PKR 270–350</td>
                                <td className="p-3 text-neutral-600 dark:text-neutral-400">PKR 250–320</td>
                            </tr>
                            <tr className="bg-white dark:bg-neutral-900">
                                <td className="p-3 font-medium text-neutral-900 dark:text-neutral-100">Weekly Lunch (5 days)</td>
                                <td className="p-3 text-neutral-600 dark:text-neutral-400">PKR 1,400–1,700</td>
                                <td className="p-3 text-neutral-600 dark:text-neutral-400">PKR 1,200–1,500</td>
                                <td className="p-3 text-neutral-600 dark:text-neutral-400">PKR 1,100–1,400</td>
                            </tr>
                            <tr className="bg-white dark:bg-neutral-900">
                                <td className="p-3 font-medium text-neutral-900 dark:text-neutral-100">Monthly Lunch Plan</td>
                                <td className="p-3 text-primary-600 dark:text-primary-400 font-semibold">PKR 6,000–8,000</td>
                                <td className="p-3 text-primary-600 dark:text-primary-400 font-semibold">PKR 5,500–7,000</td>
                                <td className="p-3 text-primary-600 dark:text-primary-400 font-semibold">PKR 5,000–6,500</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>

            {/* FAQ */}
            <section className="mb-12">
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">
                    Frequently Asked Questions — Tiffin Service Islamabad
                </h2>
                <div className="space-y-4">
                    {ISLAMABAD_FAQ.map(({ q, a }) => (
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
                <h2 className="text-2xl font-bold mb-2">Ready to Order Tiffin in Islamabad?</h2>
                <p className="text-primary-100 mb-6">Browse home cooks in your sector and order via WhatsApp today.</p>
                <Link href="/city/islamabad" className="inline-block rounded-xl bg-white px-8 py-3 text-sm font-bold text-primary-600 hover:bg-primary-50 transition-all shadow-lg">
                    Browse Islamabad Kitchens →
                </Link>
            </div>

            {/* Internal Links */}
            <section>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-3">Tiffin Service in Other Cities</h3>
                <div className="flex flex-wrap gap-2">
                    {[["lahore", "Lahore"], ["karachi", "Karachi"], ["rawalpindi", "Rawalpindi"], ["faisalabad", "Faisalabad"], ["multan", "Multan"]].map(([slug, name]) => (
                        <Link key={slug} href={`/tiffin-service-${slug}`} className="rounded-full px-4 py-1.5 text-sm font-medium bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:border-primary-400 hover:text-primary-600 transition-all">
                            Tiffin in {name}
                        </Link>
                    ))}
                </div>
            </section>
        </div>
    );
}
