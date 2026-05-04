'use client';

import React, { useState } from 'react';
import { usePlanAccess } from '@/hooks/use-plan-access';
import { cn } from '@/lib/utils';

const PLAN_ORDER = ['starter', 'growth', 'pro', 'elite'];

const PLAN_META: Record<string, {
    gradient: string;
    textColor: string;
    tagline: string;
    billing: string;
    icon: string;
    badge?: string;
    features: string[];
}> = {
    starter: {
        gradient: 'from-gray-600 to-gray-800',
        textColor: 'text-gray-700',
        icon: '🌱',
        tagline: 'Perfect to start your journey',
        billing: 'per month',
        features: [
            '7 menu items',
            '50 orders per month',
            '5% commission rate',
            '2 Group Deals per month',
            'Basic analytics dashboard',
            'Kitchen listing on platform',
            'Accept digital orders',
            'Customer review system',
        ],
    },
    growth: {
        gradient: 'from-orange-500 to-amber-500',
        textColor: 'text-orange-700',
        icon: '📈',
        tagline: 'Grow faster with more reach',
        billing: 'per 6 months (Rs. 499/mo)',
        badge: 'Most Popular',
        features: [
            '14 menu items',
            '200 orders per month',
            '3% commission rate',
            '10 Group Deals per 6 months',
            'Medium analytics + insights',
            '✨ AI Chef Assistant (daily ideas)',
            'Verified badge on profile',
            'Priority in search results',
            'Customer loyalty tracking',
        ],
    },
    pro: {
        gradient: 'from-blue-500 to-blue-700',
        textColor: 'text-blue-700',
        icon: '⚡',
        tagline: 'For serious home-cook businesses',
        billing: 'per year',
        features: [
            '15 menu items',
            '2,000 orders per month',
            '0% commission — keep it all',
            '12 Group Deals per year',
            'Advanced analytics + trends',
            '✨ AI Chef Assistant',
            '📒 Digital Khata (P&L ledger)',
            'Full branding toolkit',
            'High-priority search boost',
            'Advanced order tracking',
        ],
    },
    elite: {
        gradient: 'from-purple-600 to-purple-900',
        textColor: 'text-purple-700',
        icon: '👑',
        tagline: 'Build your food empire',
        billing: 'per year',
        badge: 'Best Value',
        features: [
            'Unlimited menu items',
            'Unlimited orders',
            '0% commission forever',
            '∞ Unlimited Group Deals',
            'AI-powered analytics + insights',
            '✨ AI Chef Assistant',
            '📒 Digital Khata (P&L ledger)',
            '💰 AI Pricing Optimizer',
            'Top listing placement 👑',
            'Premium mobile UI',
            'Dedicated account manager',
            '24/7 priority support',
        ],
    },
};

export function PricingClient({ plans }: { plans: any[] }) {
    const { data } = usePlanAccess();
    const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

    const [checkoutError, setCheckoutError] = useState<string | null>(null);

    /**
     * Safely extract a displayable error string from any API response shape.
     * Handles: string, { message }, { code, message }, null/undefined, and any other object.
     */
    const extractErrorMessage = (err: unknown, fallback: string): string => {
        if (!err) return fallback;
        if (typeof err === 'string') return err;
        if (typeof err === 'object' && err !== null) {
            const obj = err as Record<string, unknown>;
            if (typeof obj.message === 'string') return obj.message;
            if (typeof obj.code === 'string') return obj.code;
        }
        return fallback;
    };

    const handleCheckout = async (plan: typeof sorted[0]) => {
        // GUARD: Validate stripePriceId exists before calling API
        if (!plan.stripePriceId) {
            console.error(`[Checkout] Missing stripePriceId for plan: ${plan.displayName} (id: ${plan.planId})`);
            return;
        }

        setCheckoutLoading(plan.planId);
        setCheckoutError(null);

        try {
            const res = await fetch('/api/seller/subscription/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId: plan.planId })
            });

            let body: any;
            try {
                body = await res.json();
            } catch {
                setCheckoutError('Server returned an invalid response. Please try again.');
                setCheckoutLoading(null);
                return;
            }

            // Handle non-OK responses explicitly (429, 500, etc.)
            if (!res.ok) {
                const msg = extractErrorMessage(body?.error, `Request failed (${res.status}). Please try again.`);
                setCheckoutError(msg);
                setCheckoutLoading(null);
                return;
            }

            const url = body.checkoutUrl || body.data?.url;
            if (url) {
                window.location.href = url;
            } else {
                const msg = extractErrorMessage(body?.error, 'Could not start checkout. Please try again.');
                setCheckoutError(msg);
                setCheckoutLoading(null);
            }
        } catch {
            setCheckoutError('Network error. Please try again.');
            setCheckoutLoading(null);
        }
    };

    const currentIdx = PLAN_ORDER.indexOf(data?.planId as string ?? '');

    // Sort plans by order
    const sorted = [...plans].sort((a, b) =>
        PLAN_ORDER.indexOf(a.planId) - PLAN_ORDER.indexOf(b.planId)
    );

    return (
        <div className="space-y-16">

            {/* ── Plan Cards ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                {sorted.map(plan => {
                    const meta = PLAN_META[plan.planId];
                    if (!meta) return null;

                    const idx = PLAN_ORDER.indexOf(plan.planId);
                    const isCurrent = data?.planId === plan.planId;
                    const isDowngrade = currentIdx !== -1 && idx < currentIdx;
                    const isLoading = checkoutLoading === plan.planId;

                    return (
                        <div
                            key={plan.planId}
                            className={cn(
                                'relative flex flex-col rounded-2xl border bg-white overflow-hidden shadow-sm transition-all duration-200',
                                isCurrent ? 'ring-2 ring-orange-500 shadow-orange-100 shadow-lg' : 'hover:shadow-lg hover:-translate-y-0.5'
                            )}
                        >
                            {/* Badge */}
                            {meta.badge && (
                                <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full shadow z-10">
                                    {meta.badge}
                                </div>
                            )}

                            {/* Gradient header */}
                            <div className={cn('p-6 bg-gradient-to-br text-white', meta.gradient)}>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-2xl">{meta.icon}</span>
                                    <h3 className="text-lg font-extrabold tracking-tight">{plan.displayName}</h3>
                                </div>
                                <p className="text-white/70 text-xs mb-4 leading-relaxed">{meta.tagline}</p>
                                <div>
                                    <span className="text-4xl font-black">Rs.{plan.priceRs.toLocaleString()}</span>
                                    <span className="text-white/60 text-xs ml-1.5 leading-tight block mt-1">{meta.billing}</span>
                                </div>
                            </div>

                            {/* Feature list */}
                            <div className="p-5 flex-1 flex flex-col">
                                <ul className="space-y-2.5 mb-6 flex-1">
                                    {meta.features.map((f, i) => (
                                        <li key={i} className="flex items-start gap-2.5 text-sm">
                                            <span className="mt-0.5 flex-shrink-0 w-4 h-4 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-[10px] font-bold">✓</span>
                                            <span className="text-gray-700 leading-snug">{f}</span>
                                        </li>
                                    ))}
                                </ul>

                                {/* CTA */}
                                {isCurrent ? (
                                    <div className="w-full py-3 text-center text-sm font-bold text-green-700 bg-green-50 border border-green-200 rounded-xl">
                                        ✓ Current Plan
                                    </div>
                                ) : isDowngrade ? null : !plan.stripePriceId ? (
                                    <div className="w-full py-3 text-center text-sm font-bold text-gray-400 bg-gray-100 border border-gray-200 rounded-xl cursor-not-allowed">
                                        Coming Soon
                                    </div>
                                ) : (
                                    <>
                                        <button
                                            disabled={isLoading}
                                            onClick={() => handleCheckout(plan)}
                                            className={cn(
                                                'w-full py-3 rounded-xl text-sm font-bold transition-all duration-200',
                                                `bg-gradient-to-r ${meta.gradient} text-white hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0`
                                            )}
                                        >
                                            {isLoading ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                                    Redirecting...
                                                </span>
                                            ) : !data || data.isFree ? (
                                                `Get ${plan.displayName} →`
                                            ) : (
                                                `Upgrade to ${plan.displayName} →`
                                            )}
                                        </button>
                                        {checkoutError && checkoutLoading === null && (
                                            <p className="mt-2 text-xs text-red-500 text-center">{checkoutError}</p>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── Potluck explainer ──────────────────────────────────────── */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 rounded-2xl p-8">
                <div className="flex items-start gap-4 mb-6">
                    <span className="text-3xl">🫕</span>
                    <div>
                        <h3 className="text-lg font-bold text-orange-800">What is Community Potluck?</h3>
                        <p className="text-sm text-orange-700 mt-1 leading-relaxed">
                            Cook a batch and set a minimum group order. Customers reserve their plate — when the target is reached,
                            the deal activates for everyone. You sell in bulk, they save money. If the target isn't met before expiry,
                            all reservations are automatically released.
                        </p>
                    </div>
                </div>
                <div className="grid sm:grid-cols-3 gap-4">
                    {[
                        { label: "You set price", value: "Rs.200/plate", sub: "vs regular Rs.300" },
                        { label: "Target needed", value: "10 orders", sub: "to activate the deal" },
                        { label: "You earn more", value: "Bulk sales", sub: "zero per-order hassle" },
                    ].map((item) => (
                        <div key={item.label} className="bg-white rounded-xl p-4 border border-orange-100 text-center">
                            <p className="text-xs text-orange-500 font-semibold uppercase tracking-wider mb-1">{item.label}</p>
                            <p className="text-xl font-extrabold text-gray-900">{item.value}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{item.sub}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Comparison Table ─────────────────────────────────────── */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Full Comparison</h2>
                <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
                    <table className="w-full text-left border-collapse min-w-[640px]">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="text-xs uppercase text-gray-400 font-semibold p-4 w-44">Feature</th>
                                {sorted.map(plan => {
                                    const meta = PLAN_META[plan.planId];
                                    const isCurrent = data?.planId === plan.planId;
                                    return (
                                        <th key={plan.planId} className={cn('text-xs uppercase font-extrabold p-4 text-center', isCurrent && 'bg-orange-50')}>
                                            <div className={cn('inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-white text-xs font-bold bg-gradient-to-r', meta?.gradient)}>
                                                {meta?.icon} {plan.displayName}
                                            </div>
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {[
                                ["Menu Items", ["7", "14", "15", "Unlimited"]],
                                ["Monthly Orders", ["50", "200", "2,000", "Unlimited"]],
                                ["Commission", ["5%", "3%", "0%", "0%"]],
                                ["Group Deals", ["2/mo", "10/6mo", "12/yr", "Unlimited"]],
                                ["Analytics", ["Basic", "Medium", "Advanced", "AI-Powered ✨"]],
                                ["AI Chef Assistant", ["—", "✓", "✓", "✓"]],
                                ["Digital Khata", ["—", "—", "✓", "✓"]],
                                ["AI Pricing", ["—", "—", "—", "✓"]],
                                ["Search Priority", ["Standard", "Limited", "High", "Top 👑"]],
                                ["Account Manager", ["—", "—", "—", "24/7"]],
                            ].map(([label, values]) => (
                                <tr key={label as string} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                    <td className="p-4 font-medium text-gray-600 text-xs">{label as string}</td>
                                    {(values as string[]).map((val, i) => {
                                        const planId = sorted[i]?.planId;
                                        const isCurrent = data?.planId === planId;
                                        return (
                                            <td key={i} className={cn('p-4 text-center font-semibold text-xs', isCurrent && 'bg-orange-50/50')}>
                                                {val === "—" ? (
                                                    <span className="text-gray-200">—</span>
                                                ) : val === "✓" ? (
                                                    <span className="text-green-500 font-bold">✓</span>
                                                ) : (
                                                    <span className="text-gray-700">{val}</span>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
