import type { Metadata } from "next";
import Link from "next/link";
import { BASE_URL } from "@/config/site";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildFAQSchema, buildBreadcrumbSchema } from "@/lib/seo/schemas";

export const metadata: Metadata = {
    title: "Tiffin Service in Lahore – Fresh Daily Home Cooked Meals from PKR 200 | Smart Tiffin",
    description: "Looking for tiffin service in Lahore? Smart Tiffin connects you with verified home cooks offering fresh daily ghar ka khana in DHA, Gulberg, Johar Town & all Lahore areas. Order via WhatsApp from PKR 200.",
    robots: {
        index: true,
        follow: true,
        googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
    },
    alternates: {
        canonical: `${BASE_URL}/tiffin-service-lahore`,
    },
    openGraph: {
        title: "Tiffin Service in Lahore | Smart Tiffin",
        description: "Fresh daily home-cooked meals in Lahore from trusted home cooks. Starting from PKR 200.",
        url: `${BASE_URL}/tiffin-service-lahore`,
        siteName: "Smart Tiffin",
        locale: "en_PK",
        type: "website",
        images: [{ url: `${BASE_URL}/api/og?city=Lahore`, width: 1200, height: 630, alt: "Tiffin Service in Lahore – Smart Tiffin" }],
    },
    twitter: {
        card: "summary_large_image",
        title: "Tiffin Service in Lahore | Smart Tiffin",
        description: "Fresh daily home-cooked meals in Lahore from trusted home cooks. Starting from PKR 200.",
        images: [`${BASE_URL}/api/og?city=Lahore`],
    },
};

const LAHORE_AREAS = ["DHA", "Gulberg", "Johar Town", "Model Town", "Bahria Town", "Valencia Town", "Cantt", "Faisal Town", "Township", "Iqbal Town", "Garden Town", "Shadman", "Wapda Town", "Allama Iqbal Town", "Askari"];

const LAHORE_FAQ = [
    {
        q: "What is the cheapest tiffin service in Lahore?",
        a: "Most Smart Tiffin home cooks in Lahore offer single meals starting from PKR 200. The cheapest tiffin in Lahore is typically a basic lunch of roti, daal, and salad from areas like Township, Iqbal Town, or Faisal Town. DHA and Gulberg cooks tend to charge PKR 250–300 per meal.",
    },
    {
        q: "Which areas of Lahore have tiffin service available?",
        a: "Tiffin service is available across all major areas of Lahore including DHA (all phases), Gulberg, Johar Town, Model Town, Bahria Town, Valencia, Cantt, Township, Iqbal Town, Wapda Town, Garden Town, Shadman, and Askari. Contact any cook via WhatsApp to confirm delivery to your specific address.",
    },
    {
        q: "How do I order monthly tiffin in Lahore?",
        a: "Browse our Lahore home kitchens, find a cook near your area, and click the WhatsApp button to contact them. Tell them you want a monthly tiffin subscription. Most cooks offer a 10–15% discount for monthly subscriptions compared to daily orders.",
    },
    {
        q: "Is home-cooked tiffin in Lahore safe and hygienic?",
        a: "Yes. All cooks on Smart Tiffin prepare food in their personal home kitchens following standard hygiene practices. Verified cooks have additionally completed a kitchen inspection process. You can also read real customer reviews before ordering.",
    },
    {
        q: "Can I get office tiffin delivery in Gulberg and DHA Lahore?",
        a: "Absolutely. Many Smart Tiffin cooks in Lahore specifically offer office lunch delivery to DHA, Gulberg, Cantt, and Johar Town. Contact cooks in your area and ask about office tiffin packages — most have Mon–Fri lunch subscriptions.",
    },
];

export default function TiffinServiceLahorePage() {
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": "Smart Tiffin Lahore",
        "description": "Pakistan's home food marketplace connecting customers with home cooks in Lahore offering daily tiffin service.",
        "url": `${BASE_URL}/tiffin-service-lahore`,
        "areaServed": { "@type": "City", "name": "Lahore", "addressCountry": "PK" },
        "priceRange": "PKR 200–500",
        "servesCuisine": ["Pakistani", "Desi", "Home-cooked"],
        "openingHours": "Mo-Fr 07:00-22:00",
    };

    return (
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            <JsonLd schema={buildFAQSchema(LAHORE_FAQ.map(f => ({ question: f.q, answer: f.a })))} />
            <JsonLd schema={buildBreadcrumbSchema([
                { name: 'Home', url: BASE_URL },
                { name: 'Lahore', url: `${BASE_URL}/city/lahore` },
                { name: 'Tiffin Service Lahore', url: `${BASE_URL}/tiffin-service-lahore` }
            ])} />

            {/* Breadcrumb */}
            <nav className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
                <Link href="/" className="hover:text-primary-600">Home</Link>
                <span className="mx-2">/</span>
                <Link href="/city/lahore" className="hover:text-primary-600">Lahore</Link>
                <span className="mx-2">/</span>
                <span className="text-neutral-800 dark:text-neutral-200 font-medium">Tiffin Service</span>
            </nav>

            {/* Hero */}
            <div className="mb-12">
                <span className="inline-block rounded-full bg-primary-100 dark:bg-primary-900/30 px-3 py-1 text-xs font-semibold text-primary-700 dark:text-primary-300 mb-3">
                    🍱 Lahore's Home Food Platform
                </span>
                <h1 className="text-4xl font-extrabold text-neutral-900 dark:text-neutral-50 sm:text-5xl leading-tight">
                    Tiffin Service in Lahore
                </h1>
                <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-400 max-w-3xl leading-relaxed">
                    Find affordable daily tiffin service in Lahore from trusted home cooks. Fresh <em>ghar ka khana</em> —
                    roti, daal, sabzi, rice — delivered to your home or office across DHA, Gulberg, Johar Town,
                    Model Town & all Lahore areas. Starting from <strong>PKR 200</strong>. Order directly on WhatsApp.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                        href="/city/lahore"
                        className="inline-block rounded-xl bg-primary-500 px-6 py-3 text-sm font-bold text-white hover:bg-primary-600 transition-all shadow-lg"
                    >
                        Browse Lahore Home Kitchens →
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
            <section className="prose prose-neutral dark:prose-invert max-w-none mb-12">
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
                    Why Smart Tiffin is Lahore's Best Home Food Platform
                </h2>
                <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
                    Smart Tiffin is Pakistan's home food marketplace dedicated to connecting Lahore residents with
                    verified local home cooks who prepare fresh daily meals. Unlike food apps that charge restaurants
                    heavy commissions (which inflate your food prices), Smart Tiffin connects you <strong>directly
                    with the cook</strong> — no middleman, no commission, no inflated prices.
                </p>
                <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
                    Lahore is Pakistan's food capital, and the city has a long tradition of home-based cooking. From
                    the rich Lahori karahi in Gulberg to the simple, hearty daal chawal in Township — our home
                    cooks represent the true flavour of Lahore's kitchens.
                </p>
                <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    Whether you're a working professional looking for daily office lunch, a student away from
                    family, or simply someone who wants to eat healthily without the hassle of cooking — our
                    Lahore tiffin service directory has the right home cook for you.
                </p>
            </section>

            {/* Delivery Areas */}
            <section className="mb-12">
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
                    Tiffin Delivery Areas in Lahore
                </h2>
                <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                    Our Lahore home cooks offer tiffin delivery across all major neighbourhoods:
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                    {LAHORE_AREAS.map((area) => (
                        <span key={area} className="rounded-full bg-primary-50 dark:bg-primary-900/20 px-3 py-1 text-sm font-medium text-primary-700 dark:text-primary-300 border border-primary-100 dark:border-primary-800">
                            {area}
                        </span>
                    ))}
                </div>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    Don't see your area? Message any cook on WhatsApp — many extend delivery zones for subscribers.
                </p>
            </section>

            {/* Pricing */}
            <section className="mb-12">
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
                    Tiffin Service Prices in Lahore (2025)
                </h2>
                <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm mb-4">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-neutral-50 dark:bg-neutral-800">
                            <tr>
                                <th className="p-3 font-semibold text-neutral-900 dark:text-neutral-100">Plan</th>
                                <th className="p-3 font-semibold text-neutral-900 dark:text-neutral-100">DHA / Gulberg</th>
                                <th className="p-3 font-semibold text-neutral-900 dark:text-neutral-100">Johar Town / Model Town</th>
                                <th className="p-3 font-semibold text-neutral-900 dark:text-neutral-100">Township / Iqbal Town</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                            <tr className="bg-white dark:bg-neutral-900">
                                <td className="p-3 font-medium text-neutral-900 dark:text-neutral-100">Single Meal</td>
                                <td className="p-3 text-neutral-600 dark:text-neutral-400">PKR 250–300</td>
                                <td className="p-3 text-neutral-600 dark:text-neutral-400">PKR 220–280</td>
                                <td className="p-3 text-neutral-600 dark:text-neutral-400">PKR 200–250</td>
                            </tr>
                            <tr className="bg-white dark:bg-neutral-900">
                                <td className="p-3 font-medium text-neutral-900 dark:text-neutral-100">Weekly Lunch (5 days)</td>
                                <td className="p-3 text-neutral-600 dark:text-neutral-400">PKR 1,100–1,400</td>
                                <td className="p-3 text-neutral-600 dark:text-neutral-400">PKR 1,000–1,200</td>
                                <td className="p-3 text-neutral-600 dark:text-neutral-400">PKR 900–1,100</td>
                            </tr>
                            <tr className="bg-white dark:bg-neutral-900">
                                <td className="p-3 font-medium text-neutral-900 dark:text-neutral-100">Monthly Lunch Plan</td>
                                <td className="p-3 text-primary-600 dark:text-primary-400 font-semibold">PKR 4,500–6,000</td>
                                <td className="p-3 text-primary-600 dark:text-primary-400 font-semibold">PKR 4,000–5,500</td>
                                <td className="p-3 text-primary-600 dark:text-primary-400 font-semibold">PKR 3,500–5,000</td>
                            </tr>
                            <tr className="bg-white dark:bg-neutral-900">
                                <td className="p-3 font-medium text-neutral-900 dark:text-neutral-100">Full Day (Lunch + Dinner)</td>
                                <td className="p-3 text-neutral-600 dark:text-neutral-400">PKR 450–550/day</td>
                                <td className="p-3 text-neutral-600 dark:text-neutral-400">PKR 400–500/day</td>
                                <td className="p-3 text-neutral-600 dark:text-neutral-400">PKR 380–480/day</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <p className="text-xs text-neutral-500 italic">Note: Prices vary by menu (chicken vs. mutton), delivery distance, and season. Confirm exact price via WhatsApp before ordering.</p>
            </section>

            {/* How to Order */}
            <section className="mb-12">
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
                    How to Order Tiffin in Lahore — Step by Step
                </h2>
                <ol className="space-y-4">
                    {[
                        ["Browse Lahore kitchens", `Go to our Lahore home kitchens page. Use filters to find cooks in your specific area (DHA, Gulberg, Johar Town, etc.) or search by cuisine type.`],
                        ["View kitchen profile", "Click any kitchen to see their daily menu, pricing, delivery areas, customer ratings, and verification status."],
                        ["Contact on WhatsApp", "Click the WhatsApp button. Tell the cook: your meal choice, delivery address, preferred delivery time, and any dietary requirements."],
                        ["Confirm and pay", "The cook confirms availability and price. Pay via Cash on Delivery, EasyPaisa, or JazzCash."],
                        ["Receive your tiffin", "Fresh, hot home-cooked food delivered to your door in Lahore — just like ghar ka khana."],
                    ].map(([title, desc], i) => (
                        <li key={i} className="flex gap-4">
                            <span className="flex-shrink-0 h-8 w-8 rounded-full bg-primary-500 text-white flex items-center justify-center text-sm font-bold">{i + 1}</span>
                            <div>
                                <strong className="text-neutral-800 dark:text-neutral-200">{title}</strong>
                                <p className="text-neutral-600 dark:text-neutral-400 text-sm mt-0.5">{desc}</p>
                            </div>
                        </li>
                    ))}
                </ol>
            </section>

            {/* Popular Lahori Dishes */}
            <section className="mb-12">
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
                    Popular Tiffin Dishes from Lahore Home Cooks
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {["Chicken Karahi", "Daal Chawal", "Aloo Gosht", "Mix Sabzi", "Biryani & Raita", "Mutton Korma", "Kari Pakora", "Qeema Matar", "Haleem", "Nihari", "Maash Daal", "White Chana"].map((dish) => (
                        <div key={dish} className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-3 text-center text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            {dish}
                        </div>
                    ))}
                </div>
            </section>

            {/* FAQ */}
            <section className="mb-12">
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">
                    Frequently Asked Questions — Tiffin Service Lahore
                </h2>
                <div className="space-y-4">
                    {LAHORE_FAQ.map(({ q, a }) => (
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
                <h2 className="text-2xl font-bold mb-2">Ready to Order Tiffin in Lahore?</h2>
                <p className="text-primary-100 mb-6">Browse verified home cooks near you and order via WhatsApp in 2 minutes.</p>
                <Link
                    href="/city/lahore"
                    className="inline-block rounded-xl bg-white px-8 py-3 text-sm font-bold text-primary-600 hover:bg-primary-50 transition-all shadow-lg"
                >
                    Browse Lahore Kitchens →
                </Link>
            </div>

            {/* Internal Links to other cities */}
            <section>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-3">Tiffin Service in Other Cities</h3>
                <div className="flex flex-wrap gap-2">
                    {[
                        ["karachi", "Karachi"],
                        ["islamabad", "Islamabad"],
                        ["rawalpindi", "Rawalpindi"],
                        ["faisalabad", "Faisalabad"],
                        ["multan", "Multan"],
                    ].map(([slug, name]) => (
                        <Link
                            key={slug}
                            href={`/tiffin-service-${slug}`}
                            className="rounded-full px-4 py-1.5 text-sm font-medium bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:border-primary-400 hover:text-primary-600 transition-all"
                        >
                            Tiffin in {name}
                        </Link>
                    ))}
                </div>
            </section>
        </div>
    );
}
