'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/firebase/auth-context';
import { ORDER_PACKS } from '@/config/pack-pricing';

interface LimitWarningModalProps {
    kitchenId: string;
    used: number;
    limit: number;
    remaining: number;
}

export function LimitWarningModal({ kitchenId, used, limit, remaining }: LimitWarningModalProps) {
    const [dismissed, setDismissed] = useState(true); // start hidden
    const { getIdToken } = useAuth();
    const [packLoading, setPackLoading] = useState<number | null>(null);

    const today = new Date().toISOString().split('T')[0];
    const storageKey = `limit-warning:${kitchenId}:${today}`;

    useEffect(() => {
        // Check if already dismissed today
        try {
            const wasDismissed = sessionStorage.getItem(storageKey);
            if (!wasDismissed) {
                setDismissed(false);
            }
        } catch {
            setDismissed(false);
        }
    }, [storageKey]);

    const handleDismiss = () => {
        setDismissed(true);
        try {
            sessionStorage.setItem(storageKey, 'true');
        } catch { /* ignore */ }
    };

    const handleBuyPack = async (packSize: number) => {
        setPackLoading(packSize);
        try {
            const token = await getIdToken();
            const res = await fetch('/api/seller/packs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ packType: 'ORDER_PACK', packSize }),
            });
            const data = await res.json();
            if (data.data?.url) {
                window.location.href = data.data.url;
            }
        } catch {
            setPackLoading(null);
        }
    };

    if (dismissed) return null;

    const percent = Math.round((used / limit) * 100);

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleDismiss} />

            {/* Modal */}
            <div className="relative w-full max-w-lg bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
                {/* Header with gradient */}
                <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 text-white">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="text-3xl">⚡</span>
                        <div>
                            <h3 className="text-xl font-black">Almost at Your Limit!</h3>
                            <p className="text-white/80 text-sm font-medium">
                                Only <strong className="text-white">{remaining}</strong> orders remaining this month
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-5">
                    {/* Progress bar */}
                    <div>
                        <div className="flex justify-between text-xs mb-1.5">
                            <span className="text-neutral-500">Monthly Usage</span>
                            <span className="font-bold text-red-600">{used}/{limit}</span>
                        </div>
                        <div className="h-3 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-red-400 to-red-600 transition-all duration-500"
                                style={{ width: `${Math.min(100, percent)}%` }}
                            />
                        </div>
                    </div>

                    {/* Pack options */}
                    <div>
                        <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">Quick Top-Up:</p>
                        <div className="grid grid-cols-3 gap-2">
                            {ORDER_PACKS.map((pack, i) => (
                                <button
                                    key={pack.size}
                                    disabled={packLoading !== null}
                                    onClick={() => handleBuyPack(pack.size)}
                                    className={`relative rounded-xl border p-3 text-center transition-all hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50 ${
                                        i === 1
                                            ? 'border-orange-300 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-700 ring-2 ring-orange-200'
                                            : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800'
                                    }`}
                                >
                                    {i === 1 && (
                                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-[8px] font-bold px-2 py-0.5 rounded-full uppercase">Popular</span>
                                    )}
                                    <p className="text-lg font-black text-neutral-900 dark:text-white">+{pack.size}</p>
                                    <p className="text-[10px] text-neutral-500">Rs. {pack.priceRs}</p>
                                    {packLoading === pack.size && (
                                        <span className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-neutral-900/80 rounded-xl">
                                            <span className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Upgrade option */}
                    <Link
                        href="/dashboard/subscription"
                        className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-bold rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all"
                    >
                        Upgrade Plan — Unlimited orders →
                    </Link>

                    {/* Dismiss */}
                    <button
                        onClick={handleDismiss}
                        className="w-full text-center text-xs text-neutral-400 hover:text-neutral-600 transition-colors py-1"
                    >
                        Dismiss for now
                    </button>
                </div>
            </div>
        </div>
    );
}
