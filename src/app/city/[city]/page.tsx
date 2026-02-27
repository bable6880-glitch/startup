import { Suspense } from "react";
import KitchenCard, { KitchenCardSkeleton } from "@/components/ui/KitchenCard";
import SearchBar from "@/components/ui/SearchBar";
import type { Metadata } from "next";

type Props = { params: Promise<{ city: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { city } = await params;
    const name = city.charAt(0).toUpperCase() + city.slice(1);
    return {
        title: `Home Kitchens in ${name}`,
        description: `Discover authentic home-cooked meals from local kitchens in ${name}. Browse menus, check ratings, and contact cooks directly.`,
    };
}

// ISR – regenerate every 5 min for SEO
export const revalidate = 300;

async function CityKitchens({ city }: { city: string }) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
    const res = await fetch(`${baseUrl}/api/kitchens?city=${city}&limit=20`, {
        next: { revalidate: 300 },
    });

    if (!res.ok) return <p className="text-neutral-500">Failed to load kitchens.</p>;

    const result = await res.json();
    const kitchens = result.data || [];

    if (kitchens.length === 0) {
        return (
            <div className="text-center py-20">
                <span className="text-5xl block mb-4">🏙️</span>
                <h3 className="text-lg font-semibold text-neutral-700 dark:text-neutral-300">
                    No kitchens in this city yet
                </h3>
                <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                    Be the first to register your kitchen here!
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {kitchens.map((k: Record<string, unknown>) => (
                <KitchenCard
                    key={k.id as string}
                    id={k.id as string}
                    name={k.name as string}
                    city={k.city as string}
                    area={k.area as string | null}
                    rating={Number(k.avgRating) || 0}
                    totalReviews={Number(k.totalReviews) || 0}
                    imageUrl={k.coverImage as string | null}
                    cuisineType={k.cuisineType as string[] | null}
                    priceRange={k.priceRange as string | null}
                    isVerified={k.isVerified as boolean}
                    isBoosted={(Number(k.boostPriority) || 0) > 0}
                />
            ))}
        </div>
    );
}

export default async function CityPage({ params }: Props) {
    const { city } = await params;
    const cityName = city.charAt(0).toUpperCase() + city.slice(1);

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {/* Breadcrumb */}
            <nav className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
                <a href="/" className="hover:text-primary-600 transition-colors">Home</a>
                <span className="mx-2">/</span>
                <a href="/explore" className="hover:text-primary-600 transition-colors">Explore</a>
                <span className="mx-2">/</span>
                <span className="text-neutral-900 font-medium dark:text-neutral-100">{cityName}</span>
            </nav>

            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">
                    Home Kitchens in {cityName}
                </h1>
                <p className="mt-2 text-neutral-500 dark:text-neutral-400">
                    Discover local cooks serving authentic home-cooked meals in {cityName}
                </p>
            </div>

            <div className="mb-8">
                <SearchBar initialCity={cityName} compact />
            </div>

            <Suspense
                fallback={
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {Array.from({ length: 8 }).map((_, i) => <KitchenCardSkeleton key={i} />)}
                    </div>
                }
            >
                <CityKitchens city={cityName} />
            </Suspense>
        </div>
    );
}
