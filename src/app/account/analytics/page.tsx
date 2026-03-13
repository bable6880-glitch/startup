"use client";

import { useAuth } from "@/lib/firebase/auth-context";
import { useEffect, useState } from "react";
import Link from "next/link";

type Analytics = {
    totalOrders: number;
    totalSpent: number;
    totalReviews: number;
    kitchensTried: number;
    topKitchens: Array<{ name: string; orders: number }>;
    monthlySpending: Array<{ month: string; amount: number }>;
};

function StatCard({
    title,
    value,
    icon,
    sub,
    accent = false,
}: {
    title: string;
    value: string | number;
    icon: string;
    sub?: string;
    accent?: boolean;
}) {
    return (
        <div
            className={`rounded-2xl border p-5 ${
                accent
                    ? "border-primary-200/60 bg-primary-50 dark:bg-primary-900/10 dark:border-primary-900/30"
                    : "border-neutral-200/60 bg-white shadow-sm dark:bg-neutral-800 dark:border-neutral-700"
            }`}
        >
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide dark:text-neutral-400">
                        {title}
                    </p>
                    <p
                        className={`mt-1.5 text-2xl font-bold ${
                            accent ? "text-primary-700 dark:text-primary-300" : "text-neutral-900 dark:text-neutral-50"
                        }`}
                    >
                        {value}
                    </p>
                    {sub && <p className="mt-0.5 text-xs text-neutral-400 dark:text-neutral-500">{sub}</p>}
                </div>
                <span className="text-2xl">{icon}</span>
            </div>
        </div>
    );
}

function MonthlyChart({ data }: { data: Array<{ month: string; amount: number }> }) {
    const max = Math.max(...data.map((d) => d.amount), 1);

    const formatMonthLabel = (m: string) => {
        const [year, month] = m.split("-");
        const date = new Date(Number(year), Number(month) - 1, 1);
        return date.toLocaleDateString("en-US", { month: "short" });
    };

    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-28 text-sm text-neutral-400 dark:text-neutral-500">
                No spending data yet.
            </div>
        );
    }

    return (
        <div className="relative">
            {/* Y-axis hint */}
            <div className="flex items-end gap-2 h-36">
                {data.map((item) => {
                    const pct = (item.amount / max) * 100;
                    return (
                        <div key={item.month} className="group flex flex-1 flex-col items-center gap-1.5">
                            {/* Tooltip */}
                            <div className="relative">
                                <div className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 z-10 hidden group-hover:block whitespace-nowrap rounded-lg bg-neutral-900 px-2 py-1 text-xs font-medium text-white shadow-lg dark:bg-neutral-700">
                                    Rs. {item.amount.toLocaleString()}
                                </div>
                            </div>
                            {/* Bar */}
                            <div className="relative w-full flex items-end justify-center" style={{ height: "120px" }}>
                                <div
                                    className="w-full max-w-[32px] rounded-t-lg bg-primary-400 group-hover:bg-primary-500 transition-colors"
                                    style={{ height: `${Math.max(pct, 4)}%` }}
                                />
                            </div>
                            <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
                                {formatMonthLabel(item.month)}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function SkeletonCard() {
    return <div className="h-24 w-full rounded-2xl bg-neutral-200 animate-pulse dark:bg-neutral-700" />;
}

export default function AnalyticsPage() {
    const { user, getIdToken } = useAuth();
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;
        let mounted = true;
        const load = async () => {
            try {
                const token = await getIdToken();
                const res = await fetch("/api/account/analytics", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) throw new Error("Failed to fetch analytics");
                const data = await res.json();
                if (mounted) setAnalytics(data.data ?? data);
            } catch {
                if (mounted) setError("Could not load analytics. Please try again.");
            } finally {
                if (mounted) setLoading(false);
            }
        };
        load();
        return () => { mounted = false; };
    }, [user, getIdToken]);

    const avgOrderValue =
        analytics && analytics.totalOrders > 0
            ? Math.round(analytics.totalSpent / analytics.totalOrders)
            : 0;

    const recentMonths = analytics?.monthlySpending.slice(-6) ?? [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">My Analytics</h1>
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                    A snapshot of your food ordering journey.
                </p>
            </div>

            {loading ? (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
                    </div>
                    <div className="h-52 rounded-2xl bg-neutral-200 animate-pulse dark:bg-neutral-700" />
                    <div className="h-40 rounded-2xl bg-neutral-200 animate-pulse dark:bg-neutral-700" />
                </div>
            ) : error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900/30 dark:bg-red-900/10">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-3 rounded-lg px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                        Retry
                    </button>
                </div>
            ) : analytics ? (
                <>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                            title="Total Spent"
                            value={`Rs. ${analytics.totalSpent.toLocaleString()}`}
                            icon="💳"
                            sub={`Avg Rs. ${avgOrderValue.toLocaleString()} / order`}
                            accent
                        />
                        <StatCard
                            title="Total Orders"
                            value={analytics.totalOrders}
                            icon="🛍️"
                            sub={analytics.totalOrders === 0 ? "Start ordering!" : undefined}
                        />
                        <StatCard
                            title="Kitchens Tried"
                            value={analytics.kitchensTried}
                            icon="🍱"
                            sub="Unique kitchens"
                        />
                        <StatCard
                            title="Reviews Written"
                            value={analytics.totalReviews}
                            icon="⭐"
                            sub={analytics.totalReviews === 0 ? "Share your experience" : "Thank you!"}
                        />
                    </div>

                    {/* Monthly Spending Chart */}
                    <div className="rounded-2xl border border-neutral-200/60 bg-white p-6 shadow-sm dark:bg-neutral-800 dark:border-neutral-700">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                                    Monthly Spending
                                </h2>
                                <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
                                    Last {recentMonths.length} months
                                </p>
                            </div>
                            {recentMonths.length > 0 && (
                                <div className="text-right">
                                    <p className="text-xs text-neutral-400 dark:text-neutral-500">This month</p>
                                    <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                                        Rs.{" "}
                                        {(
                                            recentMonths[recentMonths.length - 1]?.amount ?? 0
                                        ).toLocaleString()}
                                    </p>
                                </div>
                            )}
                        </div>
                        <MonthlyChart data={recentMonths} />
                    </div>

                    {/* Top Kitchens & Insights */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Top Kitchens */}
                        <div className="rounded-2xl border border-neutral-200/60 bg-white p-6 shadow-sm dark:bg-neutral-800 dark:border-neutral-700">
                            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                                🏆 Favourite Kitchens
                            </h2>
                            {analytics.topKitchens.length > 0 ? (
                                <div className="space-y-3">
                                    {analytics.topKitchens.map((k, i) => {
                                        const maxOrders = analytics.topKitchens[0].orders;
                                        const pct = Math.round((k.orders / maxOrders) * 100);
                                        const trophies = ["🥇", "🥈", "🥉"];
                                        return (
                                            <div key={k.name}>
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                                                        <span>{trophies[i] ?? "🍱"}</span>
                                                        {k.name}
                                                    </span>
                                                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                                        {k.orders} order{k.orders !== 1 ? "s" : ""}
                                                    </span>
                                                </div>
                                                <div className="h-2 w-full rounded-full bg-neutral-100 dark:bg-neutral-700">
                                                    <div
                                                        className="h-2 rounded-full bg-primary-400 transition-all"
                                                        style={{ width: `${pct}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-6">
                                    <p className="text-sm text-neutral-400 dark:text-neutral-500">No orders yet.</p>
                                    <Link
                                        href="/explore"
                                        className="mt-2 inline-block text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
                                    >
                                        Explore Kitchens →
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Spending Insights */}
                        <div className="rounded-2xl border border-neutral-200/60 bg-white p-6 shadow-sm dark:bg-neutral-800 dark:border-neutral-700">
                            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
                                💡 Spending Insights
                            </h2>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 rounded-xl bg-neutral-50 p-3 dark:bg-neutral-700/40">
                                    <span className="text-xl">💳</span>
                                    <div>
                                        <p className="text-xs text-neutral-500 dark:text-neutral-400">Average Order Value</p>
                                        <p className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                                            Rs. {avgOrderValue.toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 rounded-xl bg-neutral-50 p-3 dark:bg-neutral-700/40">
                                    <span className="text-xl">📅</span>
                                    <div>
                                        <p className="text-xs text-neutral-500 dark:text-neutral-400">Months Active</p>
                                        <p className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                                            {analytics.monthlySpending.length}{" "}
                                            <span className="text-sm font-normal text-neutral-500">month{analytics.monthlySpending.length !== 1 ? "s" : ""}</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 rounded-xl bg-neutral-50 p-3 dark:bg-neutral-700/40">
                                    <span className="text-xl">🍱</span>
                                    <div>
                                        <p className="text-xs text-neutral-500 dark:text-neutral-400">Kitchen Diversity</p>
                                        <p className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                                            {analytics.kitchensTried > 0
                                                ? `${Math.round((analytics.kitchensTried / Math.max(analytics.totalOrders, 1)) * 100)}%`
                                                : "—"}
                                            <span className="ml-1 text-sm font-normal text-neutral-500">unique</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CTA */}
                    {analytics.totalOrders === 0 && (
                        <div className="rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50/50 p-10 text-center dark:border-neutral-700 dark:bg-neutral-800/20">
                            <span className="text-4xl block mb-3">📊</span>
                            <p className="text-base font-semibold text-neutral-700 dark:text-neutral-300">
                                No data yet
                            </p>
                            <p className="mt-1 text-sm text-neutral-400 dark:text-neutral-500">
                                Place your first order and your analytics will appear here.
                            </p>
                            <Link
                                href="/explore"
                                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-600 transition-colors shadow-sm"
                            >
                                Explore Kitchens →
                            </Link>
                        </div>
                    )}
                </>
            ) : null}
        </div>
    );
}
