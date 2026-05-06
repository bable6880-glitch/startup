'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/firebase/auth-context';
import { usePlanAccess } from '@/hooks/use-plan-access';
import { ORDER_PACKS, POTLUCK_PACKS } from '@/config/pack-pricing';

export default function PacksPage() {
    const { getIdToken } = useAuth();
    const { data: planAccess, loading } = usePlanAccess();
    const [packLoading, setPackLoading] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleBuyPack = async (packType: 'ORDER_PACK' | 'POTLUCK_PACK', packSize: number) => {
        const key = `${packType}:${packSize}`;
        setPackLoading(key);
        setError(null);

        try {
            const token = await getIdToken();
            const res = await fetch('/api/seller/packs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ packType, packSize }),
            });

            const data = await res.json();
            if (!res.ok) {
                setError(data.error || 'Failed to start checkout');
                setPackLoading(null);
                return;
            }

            if (data.data?.url) {
                window.location.href = data.data.url;
            } else {
                setError('Could not create checkout session');
                setPackLoading(null);
            }
        } catch {
            setError('Network error. Please try again.');
            setPackLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 w-48 bg-neutral-100 rounded-lg" />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => <div key={i} className="h-40 bg-neutral-100 rounded-2xl" />)}
                    </div>
                </div>
            </div>
        );
    }

    const planId = planAccess?.planId;
    const isElite = planId === 'elite';
    const showOrderPacks = !isElite && !!planId;
    const showPotluckPacks = !isElite && (planId === 'growth' || planId === 'pro');

    return (
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-10">
            {/* Back button */}
            <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors">
                ← Back to Dashboard
            </Link>

            <div>
                <h1 className="text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
                    Get More Capacity
                </h1>
                <p className="text-neutral-500 mt-1">
                    One-time add-on packs to extend your current plan limits.
                </p>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
                    {error}
                </div>
            )}

            {/* Elite message */}
            {isElite && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-2xl p-8 text-center">
                    <span className="text-5xl block mb-4">👑</span>
                    <h2 className="text-xl font-bold text-purple-800 dark:text-purple-300 mb-2">
                        Your Elite plan includes unlimited orders and group deals.
                    </h2>
                    <p className="text-purple-600 dark:text-purple-400">No top-ups needed!</p>
                </div>
            )}

            {/* No subscription */}
            {!planId && (
                <div className="bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl p-8 text-center">
                    <span className="text-4xl block mb-3">📦</span>
                    <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-200 mb-2">
                        You need an active subscription to buy packs
                    </h2>
                    <Link href="/dashboard/subscription" className="inline-flex mt-3 px-5 py-2.5 bg-orange-500 text-white text-sm font-bold rounded-xl hover:bg-orange-600 transition-colors">
                        View Plans →
                    </Link>
                </div>
            )}

            {/* ORDER PACKS */}
            {showOrderPacks && (
                <section>
                    <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">📦 Order Top-Up Packs</h2>
                    <p className="text-sm text-neutral-500 mb-5">Add more orders to your current monthly limit</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {ORDER_PACKS.map((pack, i) => {
                            const key = `ORDER_PACK:${pack.size}`;
                            const isLoading = packLoading === key;
                            const isPopular = i === 1;
                            return (
                                <div
                                    key={pack.size}
                                    className={`relative rounded-2xl border p-6 text-center transition-all hover:-translate-y-1 hover:shadow-lg ${
                                        isPopular
                                            ? 'border-orange-300 bg-orange-50/50 dark:bg-orange-900/10 dark:border-orange-700 shadow-md ring-2 ring-orange-200 dark:ring-orange-800'
                                            : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800'
                                    }`}
                                >
                                    {isPopular && (
                                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                            Most Popular
                                        </span>
                                    )}
                                    <p className="text-4xl font-black text-neutral-900 dark:text-white mt-2">+{pack.size}</p>
                                    <p className="text-sm text-neutral-500 mt-1 mb-4">{pack.label}</p>
                                    <p className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
                                        Rs. {pack.priceRs.toLocaleString()}
                                    </p>
                                    <button
                                        onClick={() => handleBuyPack('ORDER_PACK', pack.size)}
                                        disabled={isLoading}
                                        className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-bold rounded-xl hover:shadow-lg disabled:opacity-50 transition-all"
                                    >
                                        {isLoading ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                                Processing...
                                            </span>
                                        ) : (
                                            `Add ${pack.size} Orders`
                                        )}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* POTLUCK PACKS */}
            {showPotluckPacks && (
                <section>
                    <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">🫕 Extra Group Deal Packs</h2>
                    <p className="text-sm text-neutral-500 mb-5">Add more Group Deal uses to your plan</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {POTLUCK_PACKS.map((pack, i) => {
                            const key = `POTLUCK_PACK:${pack.size}`;
                            const isLoading = packLoading === key;
                            return (
                                <div
                                    key={pack.size}
                                    className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-6 text-center transition-all hover:-translate-y-1 hover:shadow-lg"
                                >
                                    <p className="text-4xl font-black text-neutral-900 dark:text-white">+{pack.size}</p>
                                    <p className="text-sm text-neutral-500 mt-1 mb-4">{pack.label}</p>
                                    <p className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
                                        Rs. {pack.priceRs.toLocaleString()}
                                    </p>
                                    <button
                                        onClick={() => handleBuyPack('POTLUCK_PACK', pack.size)}
                                        disabled={isLoading}
                                        className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-bold rounded-xl hover:shadow-lg disabled:opacity-50 transition-all"
                                    >
                                        {isLoading ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                                Processing...
                                            </span>
                                        ) : (
                                            `Add ${pack.size} Deals`
                                        )}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}
        </div>
    );
}
