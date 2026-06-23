import Link from 'next/link';
import { BASE_URL } from '@/config/site';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildFAQSchema, buildBreadcrumbSchema } from '@/lib/seo/schemas';

type FAQ = {
  question: string;
  answer: string;
};

type RelatedCity = {
  name: string;
  slug: string;
};

type CityTiffinPageProps = {
  city: string;
  citySlug: string;
  areas: string[];
  universities?: string[];
  officeAreas?: string[];
  relatedCities: RelatedCity[];
  faqs: FAQ[];
};

export function CityTiffinPage({
  city,
  citySlug,
  areas,
  universities,
  officeAreas,
  relatedCities,
  faqs,
}: CityTiffinPageProps) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: `Smart Tiffin ${city}`,
    description: `Pakistan's home food marketplace connecting customers with home cooks in ${city} offering daily tiffin service.`,
    url: `${BASE_URL}/tiffin-service-${citySlug}`,
    areaServed: { '@type': 'City', name: city, addressCountry: 'PK' },
    priceRange: 'PKR 200–500',
    servesCuisine: ['Pakistani', 'Desi', 'Home-cooked'],
    openingHours: 'Mo-Fr 07:00-22:00',
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <JsonLd
        schema={buildFAQSchema(
          faqs.map((f) => ({ question: f.question, answer: f.answer }))
        )}
      />
      <JsonLd
        schema={buildBreadcrumbSchema([
          { name: 'Home', url: BASE_URL },
          { name: city, url: `${BASE_URL}/city/${citySlug}` },
          {
            name: `Tiffin Service ${city}`,
            url: `${BASE_URL}/tiffin-service-${citySlug}`,
          },
        ])}
      />

      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
        <Link href="/" className="hover:text-primary-600">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link href={`/city/${citySlug}`} className="hover:text-primary-600">
          {city}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-neutral-800 dark:text-neutral-200 font-medium">
          Tiffin Service
        </span>
      </nav>

      {/* Hero */}
      <div className="mb-12">
        <span className="inline-block rounded-full bg-primary-100 dark:bg-primary-900/30 px-3 py-1 text-xs font-semibold text-primary-700 dark:text-primary-300 mb-3">
          🍱 {city}&apos;s Home Food Platform
        </span>
        <h1 className="text-4xl font-extrabold text-neutral-900 dark:text-neutral-50 sm:text-5xl leading-tight">
          Tiffin Service in {city}
        </h1>
        <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-400 max-w-3xl leading-relaxed">
          Find affordable daily tiffin service in {city} from trusted home
          cooks. Fresh <em>ghar ka khana</em> — roti, daal, sabzi, rice —
          delivered to your home or office across {city}. Starting from{' '}
          <strong>PKR 200</strong>. Order directly on WhatsApp.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/city/${citySlug}`}
            className="inline-block rounded-xl bg-primary-500 px-6 py-3 text-sm font-bold text-white hover:bg-primary-600 transition-all shadow-lg"
          >
            Browse {city} Home Kitchens →
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
          Why Smart Tiffin is {city}&apos;s Best Home Food Platform
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed mb-4">
          Smart Tiffin is Pakistan&apos;s home food marketplace dedicated to
          connecting {city} residents with verified local home cooks who prepare
          fresh daily meals. Unlike food apps that charge restaurants heavy
          commissions (which inflate your food prices), Smart Tiffin connects you{' '}
          <strong>directly with the cook</strong> — no middleman, no commission,
          no inflated prices.
        </p>
        <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
          Whether you&apos;re a working professional looking for daily office
          lunch, a student away from family, or simply someone who wants to eat
          healthily without the hassle of cooking — our {city} tiffin service
          directory has the right home cook for you.
        </p>
      </section>

      {/* Delivery Areas */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
          Tiffin Delivery Areas in {city}
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400 mb-4">
          Our {city} home cooks offer tiffin delivery across all major
          neighbourhoods:
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          {areas.map((area) => (
            <span
              key={area}
              className="rounded-full bg-primary-50 dark:bg-primary-900/20 px-3 py-1 text-sm font-medium text-primary-700 dark:text-primary-300 border border-primary-100 dark:border-primary-800"
            >
              {area}
            </span>
          ))}
        </div>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Don&apos;t see your area? Message any cook on WhatsApp — many extend
          delivery zones for subscribers.
        </p>
      </section>

      {/* Universities (if provided) */}
      {universities && universities.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
            Student Tiffin Service Near {city} Universities
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-4">
            Many home cooks deliver daily lunch and dinner to students near these
            institutions:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {universities.map((uni) => (
              <div
                key={uni}
                className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl p-3 text-sm font-medium text-neutral-700 dark:text-neutral-300 flex items-center gap-2"
              >
                <span>🎓</span> {uni}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Office Areas (if provided) */}
      {officeAreas && officeAreas.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
            Office Lunch Delivery in {city}
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-4">
            Working professionals can order daily lunch from home cooks
            delivering to these office areas:
          </p>
          <div className="flex flex-wrap gap-2">
            {officeAreas.map((area) => (
              <span
                key={area}
                className="rounded-full bg-accent-50 dark:bg-accent-900/20 px-3 py-1 text-sm font-medium text-accent-700 dark:text-accent-300 border border-accent-100 dark:border-accent-800"
              >
                🏢 {area}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* How to Order */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
          How to Order Tiffin in {city} — Step by Step
        </h2>
        <ol className="space-y-4">
          {[
            [
              `Browse ${city} kitchens`,
              `Go to our ${city} home kitchens page. Use filters to find cooks in your specific area or search by cuisine type.`,
            ],
            [
              'View kitchen profile',
              'Click any kitchen to see their daily menu, pricing, delivery areas, customer ratings, and verification status.',
            ],
            [
              'Contact on WhatsApp',
              'Click the WhatsApp button. Tell the cook: your meal choice, delivery address, preferred delivery time, and any dietary requirements.',
            ],
            [
              'Confirm and pay',
              'The cook confirms availability and price. Pay via Cash on Delivery, EasyPaisa, or JazzCash.',
            ],
            [
              'Receive your tiffin',
              `Fresh, hot home-cooked food delivered to your door in ${city} — just like ghar ka khana.`,
            ],
          ].map(([title, desc], i) => (
            <li key={i} className="flex gap-4">
              <span className="flex-shrink-0 h-8 w-8 rounded-full bg-primary-500 text-white flex items-center justify-center text-sm font-bold">
                {i + 1}
              </span>
              <div>
                <strong className="text-neutral-800 dark:text-neutral-200">
                  {title}
                </strong>
                <p className="text-neutral-600 dark:text-neutral-400 text-sm mt-0.5">
                  {desc}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* FAQ */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6">
          Frequently Asked Questions — Tiffin Service {city}
        </h2>
        <div className="space-y-4">
          {faqs.map(({ question, answer }) => (
            <details
              key={question}
              className="group bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700"
            >
              <summary className="flex cursor-pointer items-center justify-between p-5 font-semibold text-neutral-900 dark:text-neutral-100 marker:content-none">
                {question}
                <span className="ml-4 flex-shrink-0 transition-transform group-open:-rotate-180">
                  <svg
                    className="h-5 w-5 text-neutral-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </span>
              </summary>
              <div className="px-5 pb-5 text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {answer}
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="rounded-2xl bg-gradient-to-r from-primary-500 to-primary-600 p-8 text-center text-white mb-12">
        <h2 className="text-2xl font-bold mb-2">
          Ready to Order Tiffin in {city}?
        </h2>
        <p className="text-primary-100 mb-6">
          Browse verified home cooks near you and order via WhatsApp in 2
          minutes.
        </p>
        <Link
          href={`/city/${citySlug}`}
          className="inline-block rounded-xl bg-white px-8 py-3 text-sm font-bold text-primary-600 hover:bg-primary-50 transition-all shadow-lg"
        >
          Browse {city} Kitchens →
        </Link>
      </div>

      {/* Internal Links to other cities */}
      <section>
        <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-3">
          Tiffin Service in Other Cities
        </h3>
        <div className="flex flex-wrap gap-2">
          {relatedCities.map(({ name, slug }) => (
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
