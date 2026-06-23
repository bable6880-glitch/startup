import Link from "next/link";
import { PlanBadge } from "@/components/plans/PlanBadge";

type KitchenCardProps = {
    id: string;
    slug?: string | null;
    name: string;
    city: string;
    area?: string | null;
    rating: number;
    totalReviews: number;
    imageUrl?: string | null;
    cuisineType?: string[] | null;
    priceRange?: string | null;
    isVerified?: boolean;
    isBoosted?: boolean;
    distanceKm?: number | null;
    planId?: string | null;
};

export default function KitchenCard({
    id,
    slug,
    name,
    city,
    area,
    rating,
    totalReviews,
    imageUrl,
    cuisineType,
    priceRange,
    isVerified,
    isBoosted,
    distanceKm,
    planId,
}: KitchenCardProps) {
    return (
        <Link
            href={`/kitchen/${slug ?? id}`}
            className="group block rounded-2xl bg-white border border-neutral-200/60 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 dark:bg-neutral-800 dark:border-neutral-700"
        >
            {/* Image */}
            <div className="relative h-48 bg-gradient-to-br from-primary-100 to-primary-50 overflow-hidden dark:from-neutral-700 dark:to-neutral-800">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={name}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <span className="text-5xl opacity-40">🍱</span>
                    </div>
                )}

                {/* Badges */}
                <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
                    {planId && <PlanBadge planId={planId} size="sm" showIcon={true} />}
                    {isVerified && (
                        <span className="rounded-full bg-accent-500 px-2.5 py-1 text-xs font-semibold text-white shadow-sm flex items-center gap-1">
                            ✓ Verified
                        </span>
                    )}
                    {isBoosted && (
                        <span className="rounded-full bg-primary-500 px-2.5 py-1 text-xs font-semibold text-white shadow-sm flex items-center gap-1">
                            ⚡ Featured
                        </span>
                    )}
                </div>

                {/* Distance Badge */}
                {distanceKm != null && (
                    <span className="absolute top-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-bold text-white shadow-sm backdrop-blur-md">
                        {distanceKm < 1 ? '🟢 ' : distanceKm <= 3 ? '🟡 ' : '🟠 '}
                        {distanceKm} km away
                    </span>
                )}

                {/* Price */}
                {priceRange && (
                    <span className="absolute bottom-3 right-3 rounded-lg bg-white/90 backdrop-blur-sm px-2.5 py-1 text-xs font-semibold text-neutral-800 shadow-sm dark:bg-neutral-900/90 dark:text-neutral-200">
                        {priceRange}
                    </span>
                )}
            </div>

            {/* Content */}
            <div className="p-4">
                <h3 className="text-base font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors truncate dark:text-neutral-100 dark:group-hover:text-primary-400">
                    {name}
                </h3>

                <p className="mt-1 text-sm text-neutral-500 flex items-center gap-1 dark:text-neutral-400">
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {area ? `${area}, ${city}` : city}
                </p>

                {/* Cuisine Tags */}
                {cuisineType && cuisineType.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                        {cuisineType.slice(0, 3).map((t) => (
                            <span
                                key={t}
                                className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                            >
                                {t}
                            </span>
                        ))}
                        {cuisineType.length > 3 && (
                            <span className="text-xs text-neutral-400">+{cuisineType.length - 3}</span>
                        )}
                    </div>
                )}

                {/* Rating */}
                <div className="mt-3 flex items-center gap-2">
                    <div className="flex items-center gap-1 rounded-lg bg-accent-50 px-2 py-1 dark:bg-accent-900/20">
                        <svg className="h-3.5 w-3.5 text-accent-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-sm font-semibold text-accent-700 dark:text-accent-400">
                            {Number(rating) > 0 ? Number(rating).toFixed(1) : "New"}
                        </span>
                    </div>
                    {totalReviews > 0 && (
                        <span className="text-xs text-neutral-400">
                            ({totalReviews} review{totalReviews > 1 ? "s" : ""})
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
}

// ─── Skeleton ──────────────────────────────────────────────────────────────

export function KitchenCardSkeleton() {
    return (
        <div className="rounded-2xl bg-white border border-neutral-200/60 overflow-hidden dark:bg-neutral-800 dark:border-neutral-700">
            <div className="h-48 animate-shimmer" />
            <div className="p-4 space-y-3">
                <div className="h-5 w-3/4 rounded-lg animate-shimmer" />
                <div className="h-4 w-1/2 rounded-lg animate-shimmer" />
                <div className="flex gap-2">
                    <div className="h-5 w-16 rounded-full animate-shimmer" />
                    <div className="h-5 w-12 rounded-full animate-shimmer" />
                </div>
                <div className="h-4 w-24 rounded-lg animate-shimmer" />
            </div>
        </div>
    );
}
