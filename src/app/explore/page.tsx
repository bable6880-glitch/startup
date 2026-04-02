import { Suspense } from "react";
import KitchenCard, { KitchenCardSkeleton } from "@/components/ui/KitchenCard";
import SearchBar from "@/components/ui/SearchBar";
import { listKitchens } from "@/services/kitchen.service";
import { kitchenQuerySchema } from "@/lib/validations/kitchen";
import type { Metadata } from "next";
import ExploreSEO from "./ExploreSEO";

export const metadata: Metadata = {
    title: "Explore Home Kitchens in Pakistan | Smart Tiffin – Find Home Cooked Meals Near You",
    description: "Browse verified home kitchens across Pakistan. Find affordable home-cooked meals in Lahore, Karachi, Islamabad & Rawalpindi. Compare menus, pricing, and ratings. Order directly via WhatsApp. No commission.",
};

type Props = { searchParams: Promise<Record<string, string | undefined>> };

async function fetchKitchens(params: Record<string, string | undefined>) {
    try {
        // Build the query object the same way the API route does
        const queryParams: Record<string, string | undefined> = {
            city: params.city,
            cuisine: params.q || params.cuisine, // map search query to cuisine filter
            minRating: params.minRating,
            maxPrice: params.maxPrice,
            sort: params.sort,
            page: params.page || "1",
            limit: "12",
        };

        // Parse & validate with the same schema the API uses
        const parsed = kitchenQuerySchema.safeParse(queryParams);
        if (!parsed.success) {
            return { kitchens: [], total: 0, page: 1, limit: 12 };
        }

        // Call the service directly — no HTTP round-trip
        return await listKitchens(parsed.data);
    } catch (error) {
        console.error("[Explore] Failed to fetch kitchens:", {
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
        });
        return { kitchens: [], total: 0, page: 1, limit: 12 };
    }
}

async function KitchenGrid({ searchParams }: { searchParams: Record<string, string | undefined> }) {
    const result = await fetchKitchens(searchParams);
    const kitchenList = result.kitchens || [];
    const pagination = { page: result.page, limit: result.limit, total: result.total };

    if (kitchenList.length === 0) {
        return (
            <div className="text-center py-20">
                <span className="text-5xl block mb-4">🔍</span>
                <h3 className="text-lg font-semibold text-neutral-700 dark:text-neutral-300">No kitchens found</h3>
                <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                    Try adjusting your filters or search in a different city.
                </p>
            </div>
        );
    }

    const totalPages = Math.ceil(pagination.total / pagination.limit);
    const currentPage = pagination.page;

    return (
        <>
            <p className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
                Showing {kitchenList.length} of {pagination.total} kitchens
            </p>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {kitchenList.map((k: Record<string, unknown>) => (
                    <KitchenCard
                        key={k.id as string}
                        id={k.id as string}
                        name={k.name as string}
                        city={k.city as string}
                        area={k.area as string | null}
                        rating={Number(k.avgRating) || 0}
                        totalReviews={Number(k.totalReviews) || 0}
                        imageUrl={k.coverImageUrl as string | null}
                        cuisineType={k.cuisineTypes as string[] | null}
                        priceRange={k.priceRange as string | null}
                        isVerified={k.isVerified as boolean}
                        isBoosted={(Number(k.boostPriority) || 0) > 0}
                    />
                ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-10 flex justify-center gap-2">
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                        const page = i + 1;
                        const params = new URLSearchParams();
                        Object.entries(searchParams).forEach(([key, val]) => { if (val) params.set(key, val); });
                        params.set("page", String(page));
                        return (
                            <a
                                key={page}
                                href={`/explore?${params.toString()}`}
                                className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-medium transition-colors ${page === currentPage
                                    ? "bg-primary-500 text-white shadow-sm"
                                    : "bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700"
                                    }`}
                            >
                                {page}
                            </a>
                        );
                    })}
                </div>
            )}
        </>
    );
}

function GridSkeleton() {
    return (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
                <KitchenCardSkeleton key={i} />
            ))}
        </div>
    );
}

export default async function ExplorePage({ searchParams }: Props) {
    const params = await searchParams;

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">
                    Explore Kitchens
                </h1>
                <p className="mt-2 text-neutral-500 dark:text-neutral-400">
                    {params.city ? `Home kitchens in ${params.city}` : "Discover home kitchens across Pakistan"}
                </p>
            </div>

            {/* Search + Filters */}
            <div className="mb-8">
                <SearchBar initialCity={params.city} initialQuery={params.q} compact />
            </div>

            {/* Filter Pills */}
            <div className="mb-6 flex flex-wrap gap-2">
                {["Pakistani", "Chinese", "Desi", "BBQ", "Biryani", "Vegetarian"].map((cuisine) => {
                    const isActive = params.cuisine === cuisine;
                    const qs = new URLSearchParams();
                    Object.entries(params).forEach(([k, v]) => { if (v) qs.set(k, v); });
                    if (isActive) qs.delete("cuisine"); else qs.set("cuisine", cuisine);
                    return (
                        <a
                            key={cuisine}
                            href={`/explore?${qs.toString()}`}
                            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all ${isActive
                                ? "bg-primary-500 text-white shadow-sm"
                                : "bg-white border border-neutral-200 text-neutral-600 hover:border-primary-300 hover:text-primary-600 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300"
                                }`}
                        >
                            {cuisine}
                        </a>
                    );
                })}
            </div>

            {/* Kitchen Grid */}
            <Suspense fallback={<GridSkeleton />}>
                <KitchenGrid searchParams={params} />
            </Suspense>

            {/* SEO Article Area */}
            <ExploreSEO />
        </div>
    );
}
