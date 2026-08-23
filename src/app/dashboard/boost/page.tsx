"use client";

import { useAuth } from "@/lib/firebase/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { BackButton } from "@/components/ui/BackButton";
import { isFreeModeActive, freeModeEndDateLabel } from "@/config/free-mode";

export default function BoostPage() {
    const { user, loading: authLoading, getIdToken } = useAuth();
    const router = useRouter();
    const [kitchenId, setKitchenId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeBoost, setActiveBoost] = useState<{ expiresAt: string } | null>(null);
    const [selectedDuration, setSelectedDuration] = useState<7 | 14 | 30>(14);
    const [purchasing, setPurchasing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        try {
            const token = await getIdToken();
            if (!token) return;
            const kRes = await fetch("/api/kitchens?ownerId=me", { headers: { Authorization: `Bearer ${token}` } });
            if (kRes.ok) {
                const d = await kRes.json();
                const k = (d.data || [])[0];
                if (k) {
                    setKitchenId(k.id);
                    if (k.boostPriority > 0 && k.boostExpiresAt && new Date(k.boostExpiresAt) > new Date()) {
                        setActiveBoost({ expiresAt: k.boostExpiresAt });
                    }
                }
            }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, [getIdToken]);

    useEffect(() => {
        if (!authLoading && !user) { router.push("/login?redirect=/dashboard/boost"); return; }
        if (user) load();
    }, [user, authLoading, router, load]);

    const handleCheckout = async () => {
        if (!kitchenId) return;
        setPurchasing(true);
        setError(null);
        try {
            const token = await getIdToken();
            const res = await fetch("/api/seller/boost", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ durationDays: selectedDuration }),
            });

            const data = await res.json();

            if (data.success && data.data?.checkoutUrl) {
                window.location.href = data.data.checkoutUrl;
            } else {
                setError(data.error?.message || "Failed to create checkout session");
            }
        } catch { setError("Network error. Please try again."); }
        finally { setPurchasing(false); }
    };

    if (authLoading || loading) {
        return (
            <div className="mx-auto max-w-5xl px-4 py-8">
                <div className="h-64 rounded-2xl animate-shimmer" />
            </div>
        );
    }

    const prices = { 7: 500, 14: 900, 30: 1800 };

    return (
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
            <BackButton label="Dashboard" />
            <div className="text-center mb-10 mt-2">
                <h1 className="text-3xl font-bold text-neutral-900 mt-2 dark:text-neutral-50">⚡ Boost Priority</h1>
                <p className="mt-2 text-neutral-500 dark:text-neutral-400">Jump to the top of search results in your city.</p>
            </div>

            {error && (
                <div className="mb-6 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300">
                    {error}
                </div>
            )}

            {isFreeModeActive() && (
                <div className="relative overflow-hidden mb-10 rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-[#131E29] via-[#0F1722] to-[#0A0F17] p-8 sm:p-10 text-white shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl text-center">
                    <div className="pointer-events-none absolute -left-20 -top-20 h-60 w-60 rounded-full bg-emerald-500/15 blur-3xl" />
                    <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-teal-500/15 blur-3xl" />

                    <div className="relative z-10 max-w-xl mx-auto space-y-4">
                        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 border border-emerald-500/30 px-3.5 py-1 text-xs font-black uppercase tracking-wider text-emerald-300">
                            <span className="relative flex h-2 w-2">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-300" />
                            </span>
                            Top Tier Priority Included
                        </div>

                        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                            Elite Search Boost is Active
                        </h2>

                        <p className="text-sm sm:text-base text-neutral-300/90 leading-relaxed">
                            Your kitchen automatically receives maximum priority ranking in city discovery pages as part of the Free Elite promotion until <strong className="text-emerald-300">{freeModeEndDateLabel()}</strong>.
                        </p>

                        <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
                            {["Featured City Listing", "Priority Customer Matching", "Zero Additional Fee"].map((tag, i) => (
                                <span key={i} className="rounded-xl bg-white/[0.06] border border-white/10 px-3 py-1 text-xs font-semibold text-emerald-300">
                                    ✓ {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeBoost && !isFreeModeActive() && (
                <div className="mb-8 rounded-2xl border-2 border-primary-500 bg-primary-50 p-6 dark:bg-primary-900/20 text-center">
                    <h3 className="text-lg font-bold text-primary-700 dark:text-primary-300 mb-2">⭐ Your Kitchen is currently Boosted!</h3>
                    <p className="text-primary-600 dark:text-primary-400">Your priority placement is active until {new Date(activeBoost.expiresAt).toLocaleDateString('en-PK', { month: 'long', day: 'numeric' })}.</p>
                </div>
            )}

            {!isFreeModeActive() && (
                <>
                    <div className={`grid grid-cols-1 sm:grid-cols-3 gap-6 ${activeBoost ? 'opacity-50 pointer-events-none' : ''}`}>
                        {(Object.entries(prices)).map(([daysStr, price]) => {
                            const days = parseInt(daysStr) as 7 | 14 | 30;
                            return (
                                <button
                                    key={days}
                                    onClick={() => setSelectedDuration(days)}
                                    className={`relative rounded-2xl border-2 p-6 text-center transition-all ${selectedDuration === days
                                        ? "border-primary-500 bg-primary-50/50 shadow-md dark:bg-primary-900/20"
                                        : "border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-sm dark:bg-neutral-800 dark:border-neutral-700"
                                    }`}
                                >
                                    {days === 14 && (
                                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary-500 px-3 py-1 text-xs font-bold text-white shadow-sm">
                                            MOST POPULAR
                                        </span>
                                    )}
                                    <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-50 mb-1">{days} Days</h3>
                                    <p className="text-3xl font-black text-neutral-900 dark:text-neutral-50 mb-4">{price} <span className="text-sm font-medium text-neutral-500">PKR</span></p>
                                    
                                    {selectedDuration === days && <div className="absolute top-4 right-4 flex h-6 w-6 items-center justify-center rounded-full bg-primary-500 text-white">✓</div>}
                                </button>
                            )
                        })}
                    </div>

                    <div className="mt-10 flex flex-col sm:flex-row gap-4 items-center justify-center">
                        <button
                            onClick={handleCheckout}
                            disabled={purchasing || !!activeBoost || !kitchenId}
                            className="w-full sm:w-auto rounded-xl bg-primary-500 px-8 py-3.5 font-bold text-white hover:bg-primary-600 disabled:opacity-50 transition-all shadow-md"
                        >
                            {purchasing ? "Processing..." : `Checkout — ${prices[selectedDuration]} PKR`}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
