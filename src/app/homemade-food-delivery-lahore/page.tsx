import type { Metadata } from "next";
import Link from "next/link";
import { BASE_URL } from "@/config/site";
import { JsonLd } from "@/components/seo/JsonLd";
import { buildFAQSchema, buildBreadcrumbSchema } from "@/lib/seo/schemas";

export const metadata: Metadata = {
    title: "Homemade Food Delivery Lahore | Fresh Ghar Ka Khana | Smart Tiffin",
    description: "Get authentic homemade food delivery in Lahore. Order fresh, hygienic ghar ka khana directly from verified home cooks in DHA, Gulberg, Johar Town. No delivery app markups.",
    robots: {
        index: true,
        follow: true,
        googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
    },
    alternates: {
        canonical: `${BASE_URL}/homemade-food-delivery-lahore`,
    },
    openGraph: {
        title: "Homemade Food Delivery Lahore | Smart Tiffin",
        description: "Fresh daily home-cooked meals in Lahore from trusted home cooks. Authentic ghar ka khana.",
        url: `${BASE_URL}/homemade-food-delivery-lahore`,
        siteName: "Smart Tiffin",
        locale: "en_PK",
        type: "website",
        images: [{ url: `${BASE_URL}/api/og?city=Lahore`, width: 1200, height: 630, alt: "Homemade Food Delivery Lahore" }],
    },
};

const FAQ_DATA = [
    {
        q: "How is homemade food delivery different from restaurant delivery?",
        a: "Homemade food delivery on Smart Tiffin connects you directly with local families and home chefs who cook in their own kitchens. The food is prepared fresh daily, uses less oil, has no artificial additives, and tastes like authentic ghar ka khana. It's also significantly cheaper than restaurant food because there are no commercial overheads.",
    },
    {
        q: "How do I order homemade food in Lahore?",
        a: "Browse the list of verified home cooks on our Lahore city page, check their daily menus and reviews, and click the WhatsApp button to message them directly. You pay the cook directly without any platform commission fees.",
    },
    {
        q: "Are the home kitchens verified for hygiene?",
        a: "Many cooks on our platform carry a 'Verified' badge, meaning they have undergone an onboarding process. Additionally, all cooks have transparent customer reviews and ratings so you can see what others in your area think of their hygiene and food quality.",
    }
];

export default function HomemadeFoodDeliveryLahorePage() {
    return (
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
            <JsonLd schema={buildFAQSchema(FAQ_DATA.map(f => ({ question: f.q, answer: f.a })))} />
            <JsonLd schema={buildBreadcrumbSchema([
                { name: 'Home', url: BASE_URL },
                { name: 'Lahore', url: `${BASE_URL}/city/lahore` },
                { name: 'Homemade Food Delivery', url: `${BASE_URL}/homemade-food-delivery-lahore` }
            ])} />

            <nav className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
                <Link href="/" className="hover:text-primary-600">Home</Link>
                <span className="mx-2">/</span>
                <Link href="/city/lahore" className="hover:text-primary-600">Lahore</Link>
                <span className="mx-2">/</span>
                <span className="text-neutral-800 dark:text-neutral-200 font-medium">Homemade Food Delivery</span>
            </nav>

            <div className="mb-12">
                <span className="inline-block rounded-full bg-primary-100 dark:bg-primary-900/30 px-3 py-1 text-xs font-semibold text-primary-700 dark:text-primary-300 mb-3">
                    🍲 Authentic Ghar Ka Khana
                </span>
                <h1 className="text-4xl font-extrabold text-neutral-900 dark:text-neutral-50 sm:text-5xl leading-tight">
                    Homemade Food Delivery in Lahore
                </h1>
                <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-400 max-w-3xl leading-relaxed">
                    Tired of expensive and unhealthy restaurant food? Get fresh, hygienic, and affordable <strong>homemade food delivery</strong> across Lahore. Connect directly with trusted home cooks in DHA, Gulberg, Johar Town, and more.
                </p>
                <div className="mt-6">
                    <Link href="/city/lahore" className="inline-block rounded-xl bg-primary-500 px-6 py-3 text-sm font-bold text-white hover:bg-primary-600 transition-all shadow-lg">
                        Find Home Cooks in Lahore →
                    </Link>
                </div>
            </div>

            <article className="prose prose-neutral dark:prose-invert max-w-none mb-12">
                <h2>Why Choose Homemade Food Over Fast Food in Lahore?</h2>
                <p>
                    Lahore is famous for its vibrant food culture, but eating out every day takes a toll on your health and your wallet. Whether you are a student living in a hostel, a professional working late hours, or someone who simply misses their mother's cooking, homemade food delivery is the perfect solution.
                </p>
                <ul>
                    <li><strong>Healthier Options:</strong> Home cooks use less oil, standard household ingredients, and zero artificial preservatives.</li>
                    <li><strong>Affordability:</strong> A standard homemade meal in Lahore can cost between PKR 200–350, which is less than half the price of an average restaurant delivery.</li>
                    <li><strong>Zero Commission:</strong> Unlike popular food delivery apps that charge 30% commission, Smart Tiffin lets you deal directly with the cook via WhatsApp.</li>
                </ul>

                <h2>Top Homemade Dishes Delivered in Lahore</h2>
                <p>
                    Our home chefs offer a wide variety of traditional Pakistani dishes prepared fresh daily. Some of the most popular items ordered by our Lahore customers include:
                </p>
                <ul>
                    <li>Aloo Gosht with fresh Roti</li>
                    <li>Chicken Karahi (Lahori style)</li>
                    <li>Daal Chawal with Shami Kebab</li>
                    <li>Homemade Chicken Biryani</li>
                    <li>Seasonal vegetables (Bhindi, Karela, Gobi)</li>
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
                <h2 className="text-2xl font-bold mb-2">Order Fresh Homemade Food Today</h2>
                <p className="text-primary-100 mb-6">Browse home kitchens in Lahore and enjoy healthy ghar ka khana.</p>
                <Link href="/city/lahore" className="inline-block rounded-xl bg-white px-8 py-3 text-sm font-bold text-primary-600 hover:bg-primary-50 transition-all shadow-lg">
                    Browse Lahore Kitchens →
                </Link>
            </div>
        </div>
    );
}
