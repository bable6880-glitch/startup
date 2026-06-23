"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLocation } from "@/lib/location-context";

type Kitchen = {
    id: string;
    slug?: string | null;
    name: string;
    city: string | null;
    area: string | null;
    profileImageUrl: string | null;
    coverImageUrl: string | null;
    avgRating: string | null;
    reviewCount: number;
    cuisineTypes: string[] | null;
    deliveryOptions: string[] | null;
    isVerified: boolean;
    distanceKm?: number | null;
    lat?: number | null;
    lng?: number | null;
};

export function FeaturedKitchens() {
    const [kitchens, setKitchens] = useState<Kitchen[]>([]);
    const [loading, setLoading] = useState(true);
    const searchParams = useSearchParams();
    const city = searchParams.get('city') ?? 'all';
    const { location } = useLocation();

    useEffect(() => {
        (async () => {
            try {
                const baseUrl =
                    process.env.NEXT_PUBLIC_BASE_URL ||
                    (typeof window !== "undefined"
                        ? window.location.origin
                        : "http://localhost:3000");
                
                const params = new URLSearchParams();
                params.set("limit", "6");
                params.set("sort", "rating");
                if (city && city !== 'all') {
                    params.set("city", city);
                }
                if (location.status === 'granted') {
                    params.set("lat", location.lat.toString());
                    params.set("lng", location.lng.toString());
                    if (city === 'all') {
                        params.set("sort", "distance"); // pseudo sort if API supports it, or we rely on client
                    }
                }

                const res = await fetch(`${baseUrl}/api/kitchens?${params.toString()}`, {
                    headers: { "Cache-Control": "no-store" },
                });
                if (res.ok) {
                    const data = await res.json();
                    setKitchens(data.data || []);
                }
            } catch {
                /* non-critical */
            } finally {
                setLoading(false);
            }
        })();
    }, [city, location]);

    if (loading) {
        return (
            <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                <div className="text-center mb-10">
                    <h2 className="text-2xl font-bold text-neutral-900 sm:text-3xl dark:text-neutral-50">
                        Featured Kitchens
                    </h2>
                    <p className="mt-2 text-neutral-500 dark:text-neutral-400">Top-rated home kitchens near you</p>
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-72 rounded-2xl animate-shimmer" />
                    ))}
                </div>
            </section>
        );
    }

    if (kitchens.length === 0) return null;

    return (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
                <h2 className="text-2xl font-bold text-neutral-900 sm:text-3xl dark:text-neutral-50 capitalize">
                    {city !== 'all' ? `${city.replace('-', ' ')} Kitchens` : '✨ Featured Kitchens'}
                </h2>
                <p className="mt-2 text-neutral-500 dark:text-neutral-400">
                    {city !== 'all' ? 'Top-rated home kitchens in your selected city' : 'Top-rated home kitchens handpicked for you'}
                </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {kitchens.map((kitchen) => (
                    <Link
                        key={kitchen.id}
                        href={`/kitchen/${kitchen.slug ?? kitchen.id}`}
                        className="group rounded-2xl border border-neutral-200/60 bg-white shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden dark:bg-neutral-800 dark:border-neutral-700"
                    >
                        {/* Cover Image */}
                        <div className="relative h-40 bg-gradient-to-br from-primary-100 to-accent-100 overflow-hidden dark:from-primary-900/30 dark:to-accent-900/30">
                            {kitchen.coverImageUrl ? (
                                <img
                                    src={kitchen.coverImageUrl}
                                    alt={kitchen.name}
                                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                            ) : kitchen.profileImageUrl ? (
                                <img
                                    src={kitchen.profileImageUrl}
                                    alt={kitchen.name}
                                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                            ) : (
                                <div className="h-full w-full flex items-center justify-center text-5xl">
                                    🍱
                                </div>
                            )}

                            {/* Distance Badge */}
                            {kitchen.distanceKm != null && location.status === 'granted' && (
                                <span className="absolute top-3 left-3 rounded-full bg-black/60 px-2 py-1 text-xs font-bold text-white shadow-sm backdrop-blur-md">
                                    {kitchen.distanceKm < 1 ? '🟢 ' : kitchen.distanceKm <= 3 ? '🟡 ' : '🟠 '}
                                    {kitchen.distanceKm} km away
                                </span>
                            )}

                            {/* Verified Badge */}
                            {kitchen.isVerified && (
                                <span className="absolute top-3 right-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-accent-700 shadow-sm backdrop-blur-sm dark:bg-neutral-800/90 dark:text-accent-300">
                                    ✓ Verified
                                </span>
                            )}

                            {/* Delivery Badges */}
                            <div className="absolute bottom-3 left-3 flex gap-1.5">
                                {kitchen.deliveryOptions?.includes("SELF_PICKUP") && (
                                    <span className="rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-neutral-700 backdrop-blur-sm dark:bg-neutral-800/90 dark:text-neutral-300">
                                        🏃 Pickup
                                    </span>
                                )}
                                {kitchen.deliveryOptions?.includes("FREE_DELIVERY") && (
                                    <span className="rounded-full bg-accent-500/90 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                                        🛵 Free Delivery
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Info */}
                        <div className="p-5">
                            <h3 className="font-bold text-neutral-900 group-hover:text-primary-600 transition-colors dark:text-neutral-100 dark:group-hover:text-primary-400">
                                {kitchen.name}
                            </h3>

                            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                                {[kitchen.area, kitchen.city].filter(Boolean).join(", ") || "Pakistan"}
                            </p>

                            {/* Cuisines */}
                            {kitchen.cuisineTypes && kitchen.cuisineTypes.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                    {kitchen.cuisineTypes.slice(0, 3).map((c) => (
                                        <span key={c} className="rounded-md bg-primary-50 px-2 py-0.5 text-[10px] font-medium text-primary-600 dark:bg-primary-900/30 dark:text-primary-300">
                                            {c}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Rating */}
                            <div className="mt-3 flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-amber-400">★</span>
                                    <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                                        {Number(kitchen.avgRating) > 0 ? Number(kitchen.avgRating).toFixed(1) : "New"}
                                    </span>
                                    {kitchen.reviewCount > 0 && (
                                        <span className="text-xs text-neutral-400 dark:text-neutral-500">
                                            ({kitchen.reviewCount})
                                        </span>
                                    )}
                                </div>
                                <span className="text-xs font-semibold text-primary-600 group-hover:underline dark:text-primary-400">
                                    View Menu →
                                </span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {kitchens.length >= 6 && (
                <div className="text-center mt-10">
                    <Link
                        href="/explore"
                        className="inline-flex items-center gap-2 rounded-xl border-2 border-primary-300 px-6 py-3 text-sm font-bold text-primary-600 hover:bg-primary-50 transition-all dark:border-primary-700 dark:text-primary-400 dark:hover:bg-primary-900/20"
                    >
                        Explore All Kitchens →
                    </Link>
                </div>
            )}
        </section>
    );
}
