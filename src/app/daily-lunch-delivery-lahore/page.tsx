import type { Metadata } from "next";
import Link from "next/link";
import { BASE_URL } from "@/config/site";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildFAQSchema, buildBreadcrumbSchema } from "@/lib/seo/schemas";

export const metadata: Metadata = {
    title: "Daily Lunch Delivery in Lahore | Office Lunch & Monthly Plans | Smart Tiffin",
    description: "Looking for daily lunch delivery in Lahore? Get affordable office lunch and monthly meal plans delivered to your workplace. Fresh homemade food from PKR 200.",
    robots: {
        index: true,
        follow: true,
        googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
    },
    alternates: {
        canonical: `${BASE_URL}/daily-lunch-delivery-lahore`,
    },
    openGraph: {
        title: "Daily Lunch Delivery in Lahore | Office Lunch Plans",
        description: "Affordable office lunch delivery and monthly meal plans in Lahore. Fresh homemade food.",
        url: `${BASE_URL}/daily-lunch-delivery-lahore`,
        siteName: "Smart Tiffin",
        locale: "en_PK",
        type: "website",
        images: [{ url: `${BASE_URL}/api/og?city=Lahore`, width: 1200, height: 630, alt: "Daily Lunch Delivery Lahore" }],
    },
};

const FAQ_DATA = [
    {
        q: "Do you deliver lunch to offices in Gulberg and DHA?",
        a: "Yes! Many home cooks on our platform specialize in daily lunch delivery for office workers in major commercial hubs like Gulberg, DHA, Model Town, and Johar Town.",
    },
    {
        q: "How does the monthly lunch plan work?",
        a: "You can agree on a 20-day or 22-day (Mon-Fri) monthly lunch plan directly with a home cook via WhatsApp. You simply pay them the agreed monthly amount, and they will deliver a fresh lunch box to your office daily at your specified lunch break time.",
    },
    {
        q: "Is delivery included in the daily lunch price?",
        a: "Delivery policies vary by cook. Some cooks include free delivery if your office is very close to their kitchen, while others may charge a small monthly delivery fee (e.g., PKR 1,000/month) for covering the distance.",
    }
];

export default function DailyLunchDeliveryLahorePage() {
    return (
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
            <JsonLd schema={buildFAQSchema(FAQ_DATA.map(f => ({ question: f.q, answer: f.a })))} />
            <JsonLd schema={buildBreadcrumbSchema([
                { name: 'Home', url: BASE_URL },
                { name: 'Lahore', url: `${BASE_URL}/city/lahore` },
                { name: 'Daily Lunch Delivery', url: `${BASE_URL}/daily-lunch-delivery-lahore` }
            ])} />

            <nav className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
                <Link href="/" className="hover:text-primary-600">Home</Link>
                <span className="mx-2">/</span>
                <Link href="/city/lahore" className="hover:text-primary-600">Lahore</Link>
                <span className="mx-2">/</span>
                <span className="text-neutral-800 dark:text-neutral-200 font-medium">Daily Lunch Delivery</span>
            </nav>

            <div className="mb-12">
                <span className="inline-block rounded-full bg-primary-100 dark:bg-primary-900/30 px-3 py-1 text-xs font-semibold text-primary-700 dark:text-primary-300 mb-3">
                    💼 Perfect for Office Workers
                </span>
                <h1 className="text-4xl font-extrabold text-neutral-900 dark:text-neutral-50 sm:text-5xl leading-tight">
                    Daily Lunch Delivery in Lahore
                </h1>
                <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-400 max-w-3xl leading-relaxed">
                    Stop skipping lunch or eating unhealthy fast food at work. Subscribe to a <strong>daily lunch delivery</strong> plan from a local home cook in Lahore. Fresh, hot office lunches delivered right to your desk.
                </p>
                <div className="mt-6">
                    <Link href="/city/lahore" className="inline-block rounded-xl bg-primary-500 px-6 py-3 text-sm font-bold text-white hover:bg-primary-600 transition-all shadow-lg">
                        Find Lunch Providers in Lahore →
                    </Link>
                </div>
            </div>

            <article className="prose prose-neutral dark:prose-invert max-w-none mb-12">
                <h2>Office Lunch Solutions in Lahore</h2>
                <p>
                    Working a 9-to-5 job leaves little time for meal prep. Office workers in commercial areas like Gulberg, DHA, and Johar Town often rely on expensive delivery apps or unhealthy street food. Smart Tiffin offers a healthier, more affordable alternative: daily lunch delivery prepared by verified home cooks.
                </p>
                
                <h3>Benefits of a Monthly Lunch Subscription</h3>
                <ul>
                    <li><strong>Predictable Budget:</strong> Fix your monthly food budget instead of overspending daily.</li>
                    <li><strong>Better Health:</strong> Say goodbye to oily restaurant food. Enjoy balanced meals with proper portions of protein and carbs.</li>
                    <li><strong>Convenience:</strong> No need to place an order every day. Your lunch arrives automatically at your scheduled break time.</li>
                </ul>

                <h3>Typical Lunch Menus</h3>
                <p>
                    Our home cooks ensure variety so you don't get bored. A typical weekly office lunch menu might look like:
                </p>
                <ul>
                    <li><strong>Monday:</strong> Daal Mash with Roti and Fresh Salad</li>
                    <li><strong>Tuesday:</strong> Chicken Pulao with Raita</li>
                    <li><strong>Wednesday:</strong> Mixed Vegetables (Mix Sabzi) with Roti</li>
                    <li><strong>Thursday:</strong> Chicken Qorma with Naan/Roti</li>
                    <li><strong>Friday:</strong> Special Biryani or Seekh Kebab</li>
                </ul>
            </article>

            <section className="mb-12">
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">
                    Frequently Asked Questions
                </h2>
                <div className="space-y-4">
                    {FAQ_DATA.map(({ q, a }) => (
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

            <div className="rounded-2xl bg-gradient-to-r from-primary-500 to-primary-600 p-8 text-center text-white mb-12">
                <h2 className="text-2xl font-bold mb-2">Setup Your Daily Office Lunch</h2>
                <p className="text-primary-100 mb-6">Contact a home cook near your office via WhatsApp and start your subscription.</p>
                <Link href="/city/lahore" className="inline-block rounded-xl bg-white px-8 py-3 text-sm font-bold text-primary-600 hover:bg-primary-50 transition-all shadow-lg">
                    Find Lahore Kitchens →
                </Link>
            </div>
        </div>
    );
}
