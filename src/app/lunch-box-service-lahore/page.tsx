import type { Metadata } from "next";
import Link from "next/link";
import { BASE_URL } from "@/config/site";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildFAQSchema, buildBreadcrumbSchema } from "@/lib/seo/schemas";

export const metadata: Metadata = {
    title: "Lunch Box Service in Lahore | Affordable Student Tiffin | Smart Tiffin",
    description: "Find the best lunch box service in Lahore for students, hostellers, and office workers. Affordable, healthy, and hygienic home-cooked meals delivered daily.",
    robots: {
        index: true,
        follow: true,
        googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
    },
    alternates: {
        canonical: `${BASE_URL}/lunch-box-service-lahore`,
    },
    openGraph: {
        title: "Lunch Box Service in Lahore | Affordable Student Tiffin",
        description: "Affordable lunch box and tiffin service in Lahore. Perfect for students and professionals.",
        url: `${BASE_URL}/lunch-box-service-lahore`,
        siteName: "Smart Tiffin",
        locale: "en_PK",
        type: "website",
        images: [{ url: `${BASE_URL}/api/og?city=Lahore`, width: 1200, height: 630, alt: "Lunch Box Service Lahore" }],
    },
};

const FAQ_DATA = [
    {
        q: "What is a lunch box service?",
        a: "A lunch box service (also known as a tiffin service) is a daily meal delivery system where a home cook prepares a fresh, portion-controlled meal and delivers it in a container (lunch box or tiffin carrier) to your location.",
    },
    {
        q: "Are there lunch box plans for university students in Lahore?",
        a: "Yes, many home cooks on Smart Tiffin cater specifically to university students living in hostels around areas like Johar Town (UCP, UMT) and Campus (PU). They offer budget-friendly monthly plans.",
    },
    {
        q: "Do I need to return the physical lunch box container?",
        a: "This depends on the home cook. Some cooks use disposable eco-friendly containers, while others use traditional steel tiffin carriers that need to be returned or exchanged the next day.",
    }
];

export default function LunchBoxServiceLahorePage() {
    return (
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
            <JsonLd schema={buildFAQSchema(FAQ_DATA.map(f => ({ question: f.q, answer: f.a })))} />
            <JsonLd schema={buildBreadcrumbSchema([
                { name: 'Home', url: BASE_URL },
                { name: 'Lahore', url: `${BASE_URL}/city/lahore` },
                { name: 'Lunch Box Service', url: `${BASE_URL}/lunch-box-service-lahore` }
            ])} />

            <nav className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
                <Link href="/" className="hover:text-primary-600">Home</Link>
                <span className="mx-2">/</span>
                <Link href="/city/lahore" className="hover:text-primary-600">Lahore</Link>
                <span className="mx-2">/</span>
                <span className="text-neutral-800 dark:text-neutral-200 font-medium">Lunch Box Service</span>
            </nav>

            <div className="mb-12">
                <span className="inline-block rounded-full bg-primary-100 dark:bg-primary-900/30 px-3 py-1 text-xs font-semibold text-primary-700 dark:text-primary-300 mb-3">
                    🍱 Traditional Tiffin Delivery
                </span>
                <h1 className="text-4xl font-extrabold text-neutral-900 dark:text-neutral-50 sm:text-5xl leading-tight">
                    Lunch Box Service in Lahore
                </h1>
                <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-400 max-w-3xl leading-relaxed">
                    Discover reliable <strong>lunch box services</strong> in Lahore. Perfect for students living in hostels, bachelors, and busy professionals. Get fresh, portion-controlled meals from trusted home cooks starting at PKR 200/day.
                </p>
                <div className="mt-6">
                    <Link href="/city/lahore" className="inline-block rounded-xl bg-primary-500 px-6 py-3 text-sm font-bold text-white hover:bg-primary-600 transition-all shadow-lg">
                        Browse Lahore Lunch Box Providers →
                    </Link>
                </div>
            </div>

            <article className="prose prose-neutral dark:prose-invert max-w-none mb-12">
                <h2>Why Use a Lunch Box Service?</h2>
                <p>
                    The traditional tiffin or "lunch box" service has been popular in South Asia for decades, and it's experiencing a massive revival in Lahore. A lunch box service provides a structured, healthy, and affordable way to manage your daily meals.
                </p>
                
                <h3>Perfect for Hostellers & Students</h3>
                <p>
                    Living away from home often means surviving on junk food or unhygienic mess food. Our home cooks understand the needs of students and offer budget-friendly monthly lunch box plans. This ensures you get nutritious brain-food without breaking your monthly allowance.
                </p>

                <h3>What's Inside a Standard Lunch Box?</h3>
                <p>
                    A standard Pakistani homemade lunch box typically includes:
                </p>
                <ul>
                    <li>1 Main Curry (Chicken, Mutton, Beef, Daal, or Vegetable)</li>
                    <li>2 Freshly cooked Rotis (or a portion of Rice)</li>
                    <li>Side of Salad or Raita</li>
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
                <h2 className="text-2xl font-bold mb-2">Find Your Perfect Lunch Box Plan</h2>
                <p className="text-primary-100 mb-6">Connect with a home cook today and secure your daily meals.</p>
                <Link href="/city/lahore" className="inline-block rounded-xl bg-white px-8 py-3 text-sm font-bold text-primary-600 hover:bg-primary-50 transition-all shadow-lg">
                    Explore Lahore Cooks →
                </Link>
            </div>
        </div>
    );
}
