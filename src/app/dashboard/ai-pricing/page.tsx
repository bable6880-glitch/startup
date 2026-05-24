'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/firebase/auth-context';
import { usePlanAccess, isPlanAtLeast } from '@/hooks/use-plan-access';
import Link from 'next/link';

// ─── Types ──────────────────────────────────────────────────────────────────

type Meal = {
    id: string;
    name: string;
    price: number;
    category: string | null;
    isAvailable: boolean;
};

type PricingSuggestion = {
    action: 'raise' | 'lower' | 'keep';
    suggestedPriceRs: number;
    changePercent: number;
    reason: string;
};

export default function AIPricingPage() {
    const { user, getIdToken } = useAuth();
    const { data: planAccess, loading: planLoading } = usePlanAccess();

    const [meals, setMeals] = useState<Meal[]>([]);
    const [selectedMealId, setSelectedMealId] = useState('');
    const [loading, setLoading] = useState(false);
    const [mealsLoading, setMealsLoading] = useState(true);
    const [suggestion, setSuggestion] = useState<PricingSuggestion | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Check if user has access to ai_pricing feature (requires Elite plan)
    const hasAccess = !!planAccess?.isActive && isPlanAtLeast(planAccess?.planId, 'elite');

    // Fetch cook's meals for the selector
    const fetchMeals = useCallback(async () => {
        if (!user) return;
        try {
            const token = await getIdToken();
            const res = await fetch('/api/seller/menu', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                const mealList = (data.data || data.meals || []) as Meal[];
                setMeals(mealList);
                if (mealList.length > 0) setSelectedMealId(mealList[0].id);
            }
        } catch {
            // Menu fetch is non-critical — empty selector will show
        } finally {
            setMealsLoading(false);
        }
    }, [user, getIdToken]);

    useEffect(() => {
        if (hasAccess) fetchMeals();
        else setMealsLoading(false);
    }, [hasAccess, fetchMeals]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMealId) return;

        setLoading(true);
        setError(null);
        setSuggestion(null);

        try {
            const token = await getIdToken();
            const res = await fetch('/api/seller/ai/pricing', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ mealId: selectedMealId }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to get pricing suggestion');
            }

            if (data.success && data.suggestion) {
                setSuggestion(data.suggestion);
            } else {
                throw new Error('Unexpected response format');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const selectedMeal = meals.find(m => m.id === selectedMealId);

    // ─── Upgrade CTA (non-Elite users) ──────────────────────────────────────

    if (planLoading) {
        return (
            <div className="mx-auto max-w-2xl px-4 py-16 text-center">
                <div className="animate-pulse-soft space-y-4">
                    <div className="h-8 w-48 mx-auto rounded-lg animate-shimmer" />
                    <div className="h-4 w-64 mx-auto rounded-lg animate-shimmer" />
                </div>
            </div>
        );
    }

    if (!hasAccess) {
        return (
            <div className="mx-auto max-w-lg px-4 py-16 text-center">
                <div className="rounded-2xl border border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/20 dark:to-neutral-900 p-10 shadow-lg">
                    <span className="text-5xl block mb-4">✨</span>
                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50 mb-2">
                        AI Price Optimizer
                    </h1>
                    <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                        This feature is exclusive to the <strong className="text-purple-600 dark:text-purple-400">Elite</strong> plan.
                        Get AI-powered pricing recommendations based on market data and your sales history.
                    </p>
                    <Link
                        href="/dashboard/subscription"
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 text-sm font-bold text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                    >
                        Upgrade to Elite →
                    </Link>
                </div>
            </div>
        );
    }

    // ─── Main UI (Elite users) ──────────────────────────────────────────────

    return (
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-3">
                    <span className="text-3xl">✨</span>
                    AI Price Optimizer
                </h1>
                <p className="mt-2 text-neutral-500 dark:text-neutral-400">
                    Get data-driven pricing recommendations powered by market analysis and your sales history.
                </p>
            </div>

            {/* Form Card */}
            <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-6 sm:p-8 shadow-sm">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Meal Selector */}
                    <div>
                        <label htmlFor="meal-select" className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                            Select a Meal
                        </label>
                        {mealsLoading ? (
                            <div className="h-12 rounded-xl animate-shimmer" />
                        ) : meals.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-neutral-300 dark:border-neutral-600 p-4 text-center">
                                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                    No meals found.{' '}
                                    <Link href="/dashboard/menu" className="text-primary-600 dark:text-primary-400 hover:underline">
                                        Add meals to your menu first →
                                    </Link>
                                </p>
                            </div>
                        ) : (
                            <select
                                id="meal-select"
                                value={selectedMealId}
                                onChange={(e) => {
                                    setSelectedMealId(e.target.value);
                                    setSuggestion(null);
                                    setError(null);
                                }}
                                className="w-full rounded-xl border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 px-4 py-3 text-neutral-900 dark:text-neutral-100 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-colors"
                            >
                                {meals.map((meal) => (
                                    <option key={meal.id} value={meal.id}>
                                        {meal.name} — Rs. {Number(meal.price).toLocaleString()}
                                        {meal.category ? ` (${meal.category})` : ''}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Current Price Display */}
                    {selectedMeal && (
                        <div className="flex items-center gap-4 rounded-xl bg-neutral-50 dark:bg-neutral-700/50 p-4">
                            <div className="flex-1">
                                <p className="text-sm text-neutral-500 dark:text-neutral-400">Current Price</p>
                                <p className="text-xl font-bold text-neutral-900 dark:text-neutral-50">
                                    Rs. {Number(selectedMeal.price).toLocaleString()}
                                </p>
                            </div>
                            {selectedMeal.category && (
                                <span className="rounded-full bg-primary-50 dark:bg-primary-900/30 px-3 py-1 text-xs font-medium text-primary-700 dark:text-primary-300">
                                    {selectedMeal.category}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading || meals.length === 0}
                        className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                                Analysing market data...
                            </>
                        ) : (
                            <>✨ Get AI Pricing Suggestion</>
                        )}
                    </button>
                </form>

                {/* Error */}
                {error && (
                    <div className="mt-6 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
                        <p className="text-sm text-red-700 dark:text-red-300 font-medium">{error}</p>
                    </div>
                )}

                {/* Suggestion Result */}
                {suggestion && (
                    <div className="mt-8 space-y-4">
                        <div className="h-px bg-neutral-200 dark:bg-neutral-700" />

                        {/* Suggested Price — Large & Prominent */}
                        <div className="text-center py-6">
                            <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                                Suggested Price
                            </p>
                            <p className="text-5xl font-black text-neutral-900 dark:text-neutral-50">
                                Rs. {suggestion.suggestedPriceRs.toLocaleString()}
                            </p>

                            {/* Action Badge */}
                            <div className="mt-3 inline-flex items-center gap-2">
                                <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                                    suggestion.action === 'raise'
                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                        : suggestion.action === 'lower'
                                            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                }`}>
                                    {suggestion.action === 'raise' ? '📈 Raise' : suggestion.action === 'lower' ? '📉 Lower' : '✅ Keep'}
                                </span>
                                {suggestion.changePercent !== 0 && (
                                    <span className="text-sm text-neutral-500 dark:text-neutral-400">
                                        {suggestion.changePercent > 0 ? '+' : ''}{suggestion.changePercent}%
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Reasoning */}
                        <div className="rounded-xl bg-neutral-50 dark:bg-neutral-700/50 p-4">
                            <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                💡 AI Reasoning
                            </p>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                                {suggestion.reason}
                            </p>
                        </div>

                        {/* Apply Button */}
                        <Link
                            href={`/dashboard/menu?suggestedPrice=${suggestion.suggestedPriceRs}&mealName=${encodeURIComponent(selectedMeal?.name || '')}`}
                            className="block w-full text-center rounded-xl border-2 border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20 px-6 py-3 text-sm font-bold text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
                        >
                            Apply This Price in Menu →
                        </Link>
                    </div>
                )}
            </div>

            {/* Info Card */}
            <div className="mt-6 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 p-5">
                <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                    How it works
                </h3>
                <ul className="text-sm text-neutral-500 dark:text-neutral-400 space-y-1.5">
                    <li>• Compares your price to similar meals in your city</li>
                    <li>• Analyses your 30-day sales volume for this item</li>
                    <li>• Uses AI to recommend optimal pricing</li>
                    <li>• Results are cached for 1 hour to avoid redundant analysis</li>
                </ul>
            </div>
        </div>
    );
}
