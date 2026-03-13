"use client";

import { useAuth } from "@/lib/firebase/auth-context";
import { useEffect, useState } from "react";
import Link from "next/link";
import KitchenCard from "@/components/ui/KitchenCard";

type Favorite = {
    favoriteId: string;
    kitchen: {
        id: string;
        name: string;
        description: string;
        imageUrl: string | null;
        avgRating: number;
        totalReviews: number;
        city: string;
    };
};

export default function FavoritesPage() {
    const { user, getIdToken } = useAuth();
    const [favorites, setFavorites] = useState<Favorite[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const load = async () => {
            try {
                const token = await getIdToken();
                const res = await fetch("/api/account/favorites", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const d = await res.json();
                    setFavorites(d.data?.favorites ?? d.favorites ?? []);
                }
            } catch (err) {
                console.error("Failed to load favorites", err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [user, getIdToken]);

    const handleRemove = async (kitchenId: string) => {
        try {
            const token = await getIdToken();
            const res = await fetch(`/api/account/favorites/${kitchenId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                setFavorites(prev => prev.filter(f => f.kitchen.id !== kitchenId));
            } else {
                alert("Failed to remove favorite");
            }
        } catch (_err) {
            alert("Something went wrong");
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">Favorite Kitchens</h1>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-64 rounded-2xl bg-neutral-200 animate-pulse dark:bg-neutral-800" />
                    ))}
                </div>
            ) : favorites.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {favorites.map((fav) => (
                        <div key={fav.favoriteId} className="relative group">
                            <div className="pointer-events-none">
                                {/* Wrap in unclickable div if needed, or just display card */}
                                <KitchenCard
                                    id={fav.kitchen.id}
                                    name={fav.kitchen.name}
                                    city={fav.kitchen.city}
                                    rating={fav.kitchen.avgRating}
                                    totalReviews={fav.kitchen.totalReviews}
                                    imageUrl={fav.kitchen.imageUrl}
                                />
                            </div>
                            <button
                                onClick={(e) => { e.preventDefault(); handleRemove(fav.kitchen.id); }}
                                className="absolute top-3 right-3 p-2 rounded-full bg-white/90 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-neutral-100 hover:text-red-500 text-neutral-400 dark:bg-neutral-900/90 dark:hover:bg-neutral-800"
                                aria-label="Remove from favorites"
                            >
                                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/20">
                    <span className="text-4xl block mb-3">❤️</span>
                    <p className="text-neutral-500 dark:text-neutral-400 font-medium">No favorite kitchens yet</p>
                    <p className="text-sm text-neutral-400 mt-1 dark:text-neutral-500">Save the ones you love to order faster next time.</p>
                    <Link href="/explore" className="mt-4 inline-block rounded-xl bg-white px-5 py-2 text-sm font-medium text-primary-600 shadow-sm border border-neutral-200 hover:bg-neutral-50 dark:bg-neutral-800 dark:text-primary-400 dark:border-neutral-700 dark:hover:bg-neutral-700">
                        Explore Kitchens
                    </Link>
                </div>
            )}
        </div>
    );
}
