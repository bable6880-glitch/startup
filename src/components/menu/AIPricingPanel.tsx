"use client";

import { useState } from "react";
import { X, Sparkles, TrendingUp, TrendingDown, Minus, Loader2, Lock, ChevronRight } from "lucide-react";

interface AIPricingSuggestion {
    action: "raise" | "lower" | "keep";
    suggestedPriceRs: number;
    changePercent: number;
    reason: string;
}

interface AIPricingPanelProps {
    meal: {
        id: string;
        name: string;
        price: number;
        description?: string | null;
        category?: string;
    };
    kitchenId: string;
    hasAccess: boolean;
    onApplyPrice: (mealId: string, newPrice: number) => void;
    onClose: () => void;
}

export function AIPricingPanel({ meal, kitchenId, hasAccess, onApplyPrice, onClose }: AIPricingPanelProps) {
    const [suggestion, setSuggestion] = useState<AIPricingSuggestion | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [applied, setApplied] = useState(false);

    async function fetchSuggestion() {
        setLoading(true);
        setError(null);
        setSuggestion(null);

        try {
            const res = await fetch("/api/seller/ai/pricing", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mealId: meal.id }),
            });

            const data = await res.json();

            if (!res.ok) {
                if (res.status === 429) {
                    throw new Error("Daily AI limit reached. Try again tomorrow.");
                }
                if (res.status === 403) {
                    throw new Error("AI Pricing requires the Elite plan.");
                }
                throw new Error(data.error ?? "AI suggestion failed");
            }

            setSuggestion(data.suggestion);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setLoading(false);
        }
    }

    function handleApply() {
        if (!suggestion) return;
        onApplyPrice(meal.id, suggestion.suggestedPriceRs);
        setApplied(true);
        setTimeout(() => onClose(), 1200);
    }

    const actionIcon = suggestion?.action === "raise"
        ? <TrendingUp className="w-4 h-4 text-emerald-400" />
        : suggestion?.action === "lower"
            ? <TrendingDown className="w-4 h-4 text-rose-400" />
            : <Minus className="w-4 h-4 text-amber-400" />;

    const actionColor = suggestion?.action === "raise"
        ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
        : suggestion?.action === "lower"
            ? "text-rose-400 bg-rose-500/10 border-rose-500/20"
            : "text-amber-400 bg-amber-500/10 border-amber-500/20";

    // Locked state for non-Elite plans
    if (!hasAccess) {
        return (
            <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-violet-500" />
                        <span className="text-sm font-semibold text-neutral-900 dark:text-white">AI Pricing</span>
                    </div>
                    <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <div className="flex flex-col items-center justify-center flex-1 gap-4 p-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                        <Lock className="w-5 h-5 text-neutral-400" />
                    </div>
                    <div>
                        <p className="text-neutral-900 dark:text-white font-medium mb-1">Elite Feature</p>
                        <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">
                            AI Pricing is available on the Elite plan. Upgrade to get intelligent price
                            recommendations.
                        </p>
                    </div>
                    <a
                        href="/dashboard/subscription"
                        className="text-sm text-violet-600 dark:text-violet-400 hover:text-violet-500 flex items-center gap-1 font-medium"
                    >
                        View Elite plan <ChevronRight className="w-3 h-3" />
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
                        <Sparkles className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-neutral-900 dark:text-white">AI Price Suggestion</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate max-w-[160px]">{meal.name}</p>
                    </div>
                </div>
                <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 p-1">
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Current price */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">Current Price</span>
                    <span className="text-sm font-bold text-neutral-900 dark:text-white font-mono">
                        Rs. {meal.price.toLocaleString()}
                    </span>
                </div>

                {/* Loading state */}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-8 gap-3">
                        <div className="relative">
                            <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
                        </div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 animate-pulse">
                            Analyzing market data...
                        </p>
                    </div>
                )}

                {/* Error state */}
                {error && !loading && (
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30">
                        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
                    </div>
                )}

                {/* Suggestion result */}
                {suggestion && !loading && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        {/* Suggested price — hero */}
                        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-50 to-fuchsia-50 dark:from-violet-900/20 dark:to-fuchsia-900/20 border border-violet-200 dark:border-violet-500/20 p-4">
                            <p className="text-xs text-violet-600 dark:text-violet-300 mb-1 font-medium">Suggested Price</p>
                            <p className="text-3xl font-black text-neutral-900 dark:text-white font-mono">
                                Rs. {suggestion.suggestedPriceRs.toLocaleString()}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${actionColor}`}>
                                    {suggestion.action === "raise" ? "↑ Raise" : suggestion.action === "lower" ? "↓ Lower" : "→ Keep"}
                                </span>
                                {suggestion.changePercent !== 0 && (
                                    <span className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1">
                                        {actionIcon}
                                        {Math.abs(suggestion.changePercent).toFixed(0)}% change
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* AI Reasoning */}
                        <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700">
                            <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Why this price?</p>
                            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">{suggestion.reason}</p>
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-2 pt-1">
                            {applied ? (
                                <div className="flex-1 py-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm font-bold text-center">
                                    ✓ Price Applied
                                </div>
                            ) : (
                                <>
                                    <button
                                        onClick={handleApply}
                                        className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600
                                                   text-white text-sm font-bold hover:opacity-90 transition-opacity
                                                   active:scale-[0.98]"
                                    >
                                        Apply Rs. {suggestion.suggestedPriceRs.toLocaleString()}
                                    </button>
                                    <button
                                        onClick={fetchSuggestion}
                                        className="px-3 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-sm
                                                   hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                                        title="Regenerate"
                                    >
                                        ↻
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Initial state — CTA */}
                {!suggestion && !loading && !error && (
                    <div className="flex flex-col items-center justify-center py-6 gap-4 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-100 to-fuchsia-100 dark:from-violet-900/20 dark:to-fuchsia-900/20 border border-violet-200 dark:border-violet-500/20 flex items-center justify-center">
                            <Sparkles className="w-6 h-6 text-violet-500" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-neutral-900 dark:text-white mb-1">Smart Pricing</p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                                Get an AI price recommendation based on market data and competitor analysis.
                            </p>
                        </div>
                        <button
                            onClick={fetchSuggestion}
                            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600
                                       text-white text-sm font-bold hover:opacity-90 transition-all
                                       hover:-translate-y-0.5 active:translate-y-0"
                        >
                            <span className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4" />
                                Get AI Suggestion
                            </span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
