"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/auth-context";
import { PlanBadge } from "@/components/plans/PlanBadge";

type KitchenHeaderProps = {
    kitchen: {
        id: string;
        slug?: string | null;
        name: string;
        area?: string | null;
        city?: string | null;
        description?: string | null;
        avgRating: string;
        reviewCount: number;
        isVerified: boolean | null;
        deliveryOptions?: string[] | null;
        planId?: string | null;
    };
};

export function KitchenHeader({ kitchen }: KitchenHeaderProps) {
    const { user, getIdToken } = useAuth();
    const [isFavorite, setIsFavorite] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!user) return;
        const checkFavorite = async () => {
            try {
                const token = await getIdToken();
                const res = await fetch("/api/account/favorites", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const d = await res.json();
                    const favs = d.data?.favorites ?? d.favorites ?? [];
                    setIsFavorite(favs.some((f: { kitchen: { id: string } }) => f.kitchen.id === kitchen.id));
                }
            } catch (err) {
                console.error("Failed to check favorites status", err);
            }
        };
        checkFavorite();
    }, [user, kitchen.id, getIdToken]);

    const toggleFavorite = async () => {
        if (!user) {
            // Can't favorite without login
            // Using modern window.location for redirect to login
            window.location.href = `/login?redirect=/kitchen/${kitchen.slug ?? kitchen.id}`;
            return;
        }

        setLoading(true);
        try {
            const token = await getIdToken();
            if (isFavorite) {
                // Remove
                const res = await fetch(`/api/account/favorites/${kitchen.id}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) setIsFavorite(false);
            } else {
                // Add
                const res = await fetch("/api/account/favorites", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ kitchenId: kitchen.id })
                });
                if (res.ok) setIsFavorite(true);
            }
        } catch (err) {
            console.error("Failed to toggle favorite", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mt-6 relative">
            <div className="flex items-start justify-between gap-4 flex-wrap pr-12">
                <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-50">
                        Tiffin Service & Home Cooked Food by {kitchen.name}
                    </h1>
                    {kitchen.planId && (
                        <div className="mt-1 sm:mt-0">
                            <PlanBadge planId={kitchen.planId} size="lg" />
                        </div>
                    )}
                </div>

                {/* Favorite Toggle Button */}
                <button
                    onClick={toggleFavorite}
                    disabled={loading}
                    className="absolute top-0 right-0 p-2.5 rounded-full bg-neutral-100 hover:bg-neutral-200 transition-colors text-neutral-400 dark:bg-neutral-800 dark:hover:bg-neutral-700 disabled:opacity-50 group"
                    aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                >
                    <svg 
                        className={`w-6 h-6 transition-colors ${isFavorite ? "fill-red-500 text-red-500" : "fill-transparent stroke-current group-hover:text-red-500 hover:stroke-red-500 dark:text-neutral-400 dark:group-hover:text-red-400 group-hover:fill-red-500/20"}`}
                        viewBox="0 0 24 24"
                        strokeWidth={isFavorite ? "0" : "2"}
                    >
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                </button>
            </div>

            <p className="mt-2 flex items-center gap-1 text-neutral-500 dark:text-neutral-400">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {[kitchen.area, kitchen.city].filter(Boolean).join(", ")}
            </p>

            {kitchen.description && (
                <p className="mt-4 text-neutral-600 leading-relaxed dark:text-neutral-300">
                    {kitchen.description}
                </p>
            )}

            <div className="mt-4 flex items-center gap-3">
                <div className="flex items-center gap-1.5 rounded-lg bg-accent-50 px-3 py-1.5 dark:bg-accent-900/20">
                    <svg className="h-4 w-4 text-accent-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="font-bold text-accent-700 dark:text-accent-400">
                        {Number(kitchen.avgRating) > 0 ? Number(kitchen.avgRating).toFixed(1) : "New"}
                    </span>
                </div>
                <span className="text-sm text-neutral-500 dark:text-neutral-400">
                    {kitchen.reviewCount || 0} reviews
                </span>
            </div>

            {/* Delivery & Verification Badges */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
                {kitchen.isVerified && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-neutral-900 border border-emerald-100 dark:border-emerald-800/30 shadow-sm">
                        <div className="relative flex items-center justify-center">
                            <div className="absolute inset-0 bg-emerald-500 rounded-full opacity-20 animate-pulse" />
                            <div className="relative flex items-center justify-center w-5 h-5 bg-emerald-500 rounded-full shadow-sm">
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.1em] leading-none">Verified</span>
                            <span className="text-[12px] font-semibold text-neutral-900 dark:text-neutral-100 leading-tight">Trust Cook</span>
                        </div>
                    </div>
                )}

                {kitchen.deliveryOptions && kitchen.deliveryOptions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {kitchen.deliveryOptions.includes("SELF_PICKUP") && (
                            <span className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-100 px-3.5 py-2 text-xs font-semibold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 border border-neutral-200/50 dark:border-neutral-700/50">
                                🏃 Self Pickup
                            </span>
                        )}
                        {kitchen.deliveryOptions.includes("FREE_DELIVERY") && (
                            <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3.5 py-2 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/30">
                                🛵 Free Delivery
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
