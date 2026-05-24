'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/firebase/auth-context';
import { usePlanAccess, isPlanAtLeast } from '@/hooks/use-plan-access';
import { PlanBadge } from '@/components/plans/PlanBadge';
import { useKitchenSSE } from '@/hooks/use-kitchen-sse';
import Link from 'next/link';

// ─── Types ──────────────────────────────────────────────────────────────────

type RevenueData = {
    dates: string[];
    revenues: number[];
    orders: number[];
    totalRevenue: number;
    totalOrders: number;
};

type InsightsData = {
    peakDay: string | null;
    bestSeller: string | null;
    aiTip: string | null;
};

type RecentOrder = {
    id: string;
    customerName: string;
    itemsSummary: string;
    totalAmount: number;
    status: string;
    createdAt: string;
};

export default function EliteDashboardPage() {
    const router = useRouter();
    const { user, loading: authLoading, getIdToken } = useAuth();
    const { data: planAccess, loading: planLoading } = usePlanAccess();

    // ─── Privacy Mode ────────────────────────────────────────────────
    const [privacyMode, setPrivacyMode] = useState(false);

    useEffect(() => {
        const stored = localStorage.getItem('elite-privacy-mode');
        if (stored === 'true') setPrivacyMode(true);
    }, []);

    const togglePrivacy = () => {
        const next = !privacyMode;
        setPrivacyMode(next);
        localStorage.setItem('elite-privacy-mode', String(next));
    };

    // ─── Revenue Chart Data ──────────────────────────────────────────
    const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
    const [revenuePeriod, setRevenuePeriod] = useState<'7d' | '30d' | '90d'>('30d');
    const [revenueLoading, setRevenueLoading] = useState(false);

    // ─── AI Insights ─────────────────────────────────────────────────
    const [insights, setInsights] = useState<InsightsData | null>(null);
    const [insightsLoading, setInsightsLoading] = useState(false);

    // ─── Recent Orders ───────────────────────────────────────────────
    const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
    const [ordersLoading, setOrdersLoading] = useState(false);

    // ─── Lifetime Earnings ───────────────────────────────────────────
    const [lifetimeEarnings, setLifetimeEarnings] = useState(0);

    // ─── Kitchen ID from plan access ─────────────────────────────────
    const kitchenId = (planAccess?.subscription as any)?.kitchenId || '';

    // ─── SSE for real-time orders ────────────────────────────────────
    const handleNewOrder = useCallback((payload: Record<string, unknown>) => {
        const newOrder: RecentOrder = {
            id: payload.orderId as string,
            customerName: (payload.customerName as string) || 'Customer',
            itemsSummary: `${payload.itemCount} item(s)`,
            totalAmount: payload.totalAmount as number,
            status: 'PENDING',
            createdAt: new Date().toISOString(),
        };
        setRecentOrders(prev => [newOrder, ...prev.slice(0, 9)]);
    }, []);

    useKitchenSSE({
        kitchenId,
        onNewOrder: handleNewOrder,
    });

    // ─── Fetch revenue data ──────────────────────────────────────────
    const fetchRevenue = useCallback(async (period: '7d' | '30d' | '90d') => {
        try {
            setRevenueLoading(true);
            const token = await getIdToken();
            const res = await fetch(`/api/seller/analytics/revenue?period=${period}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const json = await res.json();
                setRevenueData(json.data || json);
            }
        } catch { /* non-critical */ } finally {
            setRevenueLoading(false);
        }
    }, [getIdToken]);

    // ─── Fetch insights ──────────────────────────────────────────────
    const fetchInsights = useCallback(async () => {
        try {
            setInsightsLoading(true);
            const token = await getIdToken();
            const res = await fetch('/api/seller/analytics/insights', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const json = await res.json();
                setInsights(json.data || json);
            }
        } catch { /* non-critical */ } finally {
            setInsightsLoading(false);
        }
    }, [getIdToken]);

    // ─── Fetch recent orders ─────────────────────────────────────────
    const fetchRecentOrders = useCallback(async () => {
        try {
            setOrdersLoading(true);
            const token = await getIdToken();
            const res = await fetch('/api/seller/orders/recent', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const json = await res.json();
                setRecentOrders(json.data || []);
            }
        } catch { /* non-critical */ } finally {
            setOrdersLoading(false);
        }
    }, [getIdToken]);

    // ─── Load data on mount ──────────────────────────────────────────
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login?redirect=/dashboard/elite');
            return;
        }
    }, [authLoading, user, router]);

    useEffect(() => {
        if (planLoading || !planAccess) return;

        // Guard: Non-Elite redirect
        if (!isPlanAtLeast(planAccess.planId, 'elite')) {
            router.push('/dashboard/subscription');
            return;
        }

        fetchRevenue(revenuePeriod);
        fetchInsights();
        fetchRecentOrders();
    }, [planAccess, planLoading, revenuePeriod, fetchRevenue, fetchInsights, fetchRecentOrders, router]);

    // ─── Loading state ───────────────────────────────────────────────
    if (authLoading || planLoading) {
        return (
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
                <div className="animate-pulse space-y-6">
                    <div className="h-40 rounded-3xl bg-neutral-100 dark:bg-neutral-800" />
                    <div className="grid grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => <div key={i} className="h-28 rounded-2xl bg-neutral-100 dark:bg-neutral-800" />)}
                    </div>
                </div>
            </div>
        );
    }

    if (!planAccess || !isPlanAtLeast(planAccess.planId, 'elite')) return null;

    const maxRevenue = revenueData ? Math.max(...revenueData.revenues, 1) : 1;

    return (
        <div className={`mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 ${privacyMode ? 'privacy-mode' : ''}`}>

            {/* ── Elite Header ────────────────────────────────────────────── */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-neutral-950 via-purple-950 to-neutral-950 p-8 sm:p-12 text-white shadow-2xl border border-purple-800/30">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-pink-600/20 blur-3xl" />
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-64 w-64 rounded-full bg-purple-600/20 blur-3xl" />

                <div className="relative z-10 flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <PlanBadge planId="elite" size="lg" />
                        </div>
                        <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-2">
                            Welcome to Elite Command
                        </h1>
                        <p className="text-purple-200 text-lg sm:text-xl font-medium max-w-2xl opacity-90">
                            Zero commission. Infinite orders. Full control.
                        </p>
                    </div>

                    {/* Privacy Mode Toggle */}
                    <button
                        onClick={togglePrivacy}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-sm font-medium transition-colors"
                    >
                        {privacyMode ? '🔓 Show Data' : '🔒 Privacy Mode'}
                    </button>
                </div>
            </div>

            {/* ── Core Elite Stats ────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent to-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="text-3xl mb-3 block">💰</span>
                    <h3 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">0% Commission Saved</h3>
                    <p className="text-3xl font-black text-neutral-900 dark:text-white mt-1 sensitive-data">
                        Rs. {Math.round((revenueData?.totalRevenue ?? 0) * 0.15).toLocaleString()}
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-2 font-medium">Estimated savings vs Starter Plan</p>
                </div>

                <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="text-3xl mb-3 block">♾️</span>
                    <h3 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">Order Capacity</h3>
                    <p className="text-3xl font-black text-neutral-900 dark:text-white mt-1">Unlimited</p>
                    <p className="text-xs text-purple-600 dark:text-purple-400 mt-2 font-medium">No monthly caps</p>
                </div>

                <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="text-3xl mb-3 block">🚀</span>
                    <h3 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">Visibility Boost</h3>
                    <p className="text-3xl font-black text-neutral-900 dark:text-white mt-1">Level 3</p>
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 font-medium">Top placement in search</p>
                </div>
            </div>

            {/* ── Revenue Chart ────────────────────────────────────────────── */}
            <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm">
                <div className="px-6 py-5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-neutral-900 dark:text-white">📊 Revenue Analytics</h2>
                    <div className="flex gap-1 bg-neutral-200 dark:bg-neutral-700 rounded-lg p-0.5">
                        {(['7d', '30d', '90d'] as const).map(p => (
                            <button
                                key={p}
                                onClick={() => setRevenuePeriod(p)}
                                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                                    revenuePeriod === p
                                        ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm'
                                        : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                                }`}
                            >
                                {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '3 Months'}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="p-6 sensitive-data">
                    {revenueLoading ? (
                        <div className="h-48 flex items-center justify-center text-neutral-400 animate-pulse">Loading chart...</div>
                    ) : revenueData && revenueData.dates.length > 0 ? (
                        <>
                            <div className="flex items-end gap-1 h-48">
                                {revenueData.revenues.map((rev, i) => (
                                    <div key={i} className="flex-1 flex flex-col items-center justify-end group relative">
                                        <div
                                            className="w-full rounded-t-md bg-gradient-to-t from-orange-500 to-amber-400 min-h-[2px] transition-all duration-300 hover:from-orange-600 hover:to-amber-500 cursor-pointer"
                                            style={{ height: `${Math.max(2, (rev / maxRevenue) * 100)}%` }}
                                        />
                                        {/* Tooltip */}
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-neutral-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                            Rs. {rev.toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex justify-between mt-2 text-[10px] text-neutral-400">
                                <span>{revenueData.dates[0]}</span>
                                <span>{revenueData.dates[revenueData.dates.length - 1]}</span>
                            </div>
                            <div className="flex gap-6 mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                                <div>
                                    <p className="text-xs text-neutral-500">Total Revenue</p>
                                    <p className="text-lg font-black text-neutral-900 dark:text-white">Rs. {revenueData.totalRevenue.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-neutral-500">Total Orders</p>
                                    <p className="text-lg font-black text-neutral-900 dark:text-white">{revenueData.totalOrders}</p>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="h-48 flex items-center justify-center text-neutral-400">No revenue data for this period</div>
                    )}
                </div>
            </div>

            {/* ── AI Insights + Real-time Orders ──────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* AI Insights */}
                <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm">
                    <div className="px-6 py-5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
                        <h2 className="text-lg font-bold text-neutral-900 dark:text-white">🧠 AI Business Insights</h2>
                    </div>
                    <div className="p-6 space-y-4">
                        {insightsLoading ? (
                            <div className="space-y-3 animate-pulse">
                                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-neutral-100 dark:bg-neutral-800 rounded-xl" />)}
                            </div>
                        ) : insights ? (
                            <>
                                <div className="flex items-start gap-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800">
                                    <span className="text-2xl">📅</span>
                                    <div>
                                        <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Peak Day</p>
                                        <p className="text-sm font-bold text-neutral-900 dark:text-white mt-0.5">{insights.peakDay || 'Not enough data'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 border border-orange-100 dark:border-orange-800">
                                    <span className="text-2xl">🍛</span>
                                    <div>
                                        <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wider">Best Seller</p>
                                        <p className="text-sm font-bold text-neutral-900 dark:text-white mt-0.5 sensitive-data">{insights.bestSeller || 'Not enough data'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-100 dark:border-purple-800">
                                    <span className="text-2xl">💡</span>
                                    <div>
                                        <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">AI Tip</p>
                                        <p className="text-sm font-bold text-neutral-900 dark:text-white mt-0.5">{insights.aiTip || 'Keep maintaining quality for repeat orders!'}</p>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <p className="text-sm text-neutral-400 text-center py-6">Unable to load insights</p>
                        )}
                    </div>
                </div>

                {/* Real-time Order Tracker */}
                <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm">
                    <div className="px-6 py-5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
                        <h2 className="text-lg font-bold text-neutral-900 dark:text-white">⚡ Live Order Feed</h2>
                    </div>
                    <div className="divide-y divide-neutral-100 dark:divide-neutral-800 max-h-[400px] overflow-y-auto">
                        {ordersLoading ? (
                            <div className="p-6 space-y-3 animate-pulse">
                                {[1, 2, 3].map(i => <div key={i} className="h-14 bg-neutral-100 dark:bg-neutral-800 rounded-xl" />)}
                            </div>
                        ) : recentOrders.length > 0 ? (
                            recentOrders.map(order => (
                                <div key={order.id} className="px-6 py-4 flex items-center justify-between gap-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-neutral-900 dark:text-white truncate sensitive-data">
                                            {order.customerName}
                                        </p>
                                        <p className="text-xs text-neutral-500 truncate">{order.itemsSummary}</p>
                                        <p className="text-[10px] text-neutral-400 mt-0.5">{getRelativeTime(order.createdAt)}</p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="text-sm font-bold text-neutral-900 dark:text-white sensitive-data">
                                            Rs. {Number(order.totalAmount).toLocaleString()}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                            order.status === 'COMPLETED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                            order.status === 'PENDING' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                            order.status === 'ACCEPTED' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                            'bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400'
                                        }`}>
                                            {order.status}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-6 text-center text-sm text-neutral-400">No recent orders</div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Exclusive Feature Toggles ───────────────────────────────── */}
            <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm">
                <div className="px-6 py-5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
                    <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Elite Feature Settings</h2>
                </div>

                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    <div className="p-6 flex items-start justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-neutral-900 dark:text-white">Auto-WhatsApp Replies</h3>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 uppercase tracking-wider">Active</span>
                            </div>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                AI automatically replies to customers on WhatsApp when they ask about your menu or hours.
                            </p>
                        </div>
                    </div>

                    <div className="p-6 flex items-start justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-neutral-900 dark:text-white">Dedicated Account Manager</h3>
                            </div>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                Priority 24/7 support line. Current manager: <strong>Sarah Ahmad</strong>.
                            </p>
                        </div>
                        <a href="https://wa.me/923000000000" target="_blank" rel="noreferrer" className="shrink-0 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white text-sm font-semibold rounded-lg transition-colors">
                            Message Sarah
                        </a>
                    </div>

                    <div className="p-6 flex items-start justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-neutral-900 dark:text-white">White-label Branding</h3>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 uppercase tracking-wider">Active</span>
                            </div>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                Your storefront is free of Smart Tiffin logos. Receipts are sent under your kitchen name.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getRelativeTime(dateString: string): string {
    const diff = Date.now() - new Date(dateString).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
}
