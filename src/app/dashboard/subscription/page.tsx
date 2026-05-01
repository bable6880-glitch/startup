import { db } from '@/lib/db';
import { planConfigs } from '@/lib/db/schema';
import { PricingClient } from './pricing-client';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function PricingPage() {
    // Fetch plan configs server-side
    const plans = await db.query.planConfigs.findMany({
        orderBy: (configs, { asc }) => [asc(configs.sortOrder)]
    });

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="mb-8">
                <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">
                    ← Back to Dashboard
                </Link>
            </div>
            
            <div className="mb-12 text-center max-w-3xl mx-auto">
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 mb-4">
                    Simple, transparent pricing for every cook
                </h1>
                <p className="text-lg text-gray-500">
                    Whether you are just starting out or running a full-time kitchen, we have a plan that fits your needs.
                </p>
            </div>

            <PricingClient plans={plans} />
        </div>
    );
}
