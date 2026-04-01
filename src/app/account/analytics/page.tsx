"use client";

import { useAuth } from "@/lib/firebase/auth-context";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

// Types
type MonthlyData = { month: string; count: number; spendPkr: number };
type StatusBreakdown = { PENDING: number; ACCEPTED: number; COMPLETED: number; CANCELLED: number };
type FavoriteKitchen = { id: string; name: string; orderCount: number };
type AnalyticsData = {
    totalOrders: number;
    totalSpendPkr: number;
    averageOrderValuePkr: number;
    kitchensTried: number;
    reviewsGiven: number;
    favoriteKitchen: FavoriteKitchen | null;
    ordersByMonth: MonthlyData[];
    statusBreakdown: StatusBreakdown;
};

export default function BuyerAnalyticsPage() {
    const { user, loading: authLoading, getIdToken } = useAuth();
    const router = useRouter();
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        try {
            const token = await getIdToken();
            if (!token) return;
            const res = await fetch("/api/account/analytics", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const json = await res.json();
                setData(json.data);
            } else {
                setError("Failed to load analytics");
            }
        } catch (err) {
            setError("Network error");
        } finally {
            setLoading(false);
        }
    }, [getIdToken]);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login?redirect=/account/analytics");
            return;
        }
        if (user) loadData();
    }, [user, authLoading, router, loadData]);

    if (authLoading || loading) {
        return (
            <div className="mx-auto max-w-5xl px-4 py-8">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
                    {[1,2,3,4].map(i => <div key={i} className="h-32 rounded-2xl animate-shimmer" />)}
                </div>
            </div>
        );
    }

    if (error) {
        return <div className="p-8 text-center text-red-500">{error}</div>;
    }

    if (!data || data.totalOrders === 0) {
        return (
            <div className="mx-auto max-w-3xl px-4 py-20 text-center">
                <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50 mb-4">Your Analytics</h1>
                <p className="text-neutral-500 dark:text-neutral-400">No orders yet. Start exploring kitchens to see your stats!</p>
            </div>
        );
    }

    // Prepare chart
    const maxMonthOrders = Math.max(...data.ordersByMonth.map(m => m.count), 1);

    return (
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-50 mb-8">
                Your Food Journey
            </h1>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <MetricCard title="Total Orders" value={data.totalOrders} icon="🛍️" />
                <MetricCard title="Total Spent" value={`Rs. ${data.totalSpendPkr.toLocaleString()}`} icon="💸" />
                <MetricCard title="Avg. Order Value" value={`Rs. ${data.averageOrderValuePkr.toLocaleString()}`} icon="📊" />
                <MetricCard title="Kitchens Tried" value={data.kitchensTried} icon="👩‍🍳" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Chart Section */}
                <div className="lg:col-span-2 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:bg-neutral-800 dark:border-neutral-700">
                    <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-6">Orders (Last 6 Months)</h2>
                    <div className="flex h-64 items-end gap-2 sm:gap-4">
                        {data.ordersByMonth.map((month) => {
                            const heightPct = (month.count / maxMonthOrders) * 100;
                            return (
                                <div key={month.month} className="flex flex-1 flex-col items-center justify-end group">
                                    <div className="w-full relative flex flex-col items-center justify-end h-full">
                                        <div 
                                            className="w-full max-w-[40px] rounded-t-md bg-primary-500 transition-all duration-500 group-hover:bg-primary-600 dark:bg-primary-600 dark:group-hover:bg-primary-500"
                                            style={{ height: `${heightPct}%`, minHeight: month.count > 0 ? '4px' : '0' }}
                                        >
                                            {month.count > 0 && (
                                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-800 text-white text-xs py-1 px-2 rounded pointer-events-none whitespace-nowrap z-10">
                                                    {month.count} orders<br/>Rs. {month.spendPkr}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <span className="mt-3 text-xs text-neutral-500 dark:text-neutral-400 font-medium rotate-[-45deg] sm:rotate-0 origin-top-left sm:origin-center">{month.month.split(' ')[0]}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Side Stats */}
                <div className="space-y-6">
                    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:bg-neutral-800 dark:border-neutral-700">
                        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-4">Highlights</h2>
                        <ul className="space-y-4">
                            <li className="flex items-center gap-3">
                                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-50 text-accent-600 text-xl dark:bg-accent-900/30 dark:text-accent-400">⭐</span>
                                <div>
                                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Reviews Given</p>
                                    <p className="font-semibold text-neutral-900 dark:text-neutral-50">{data.reviewsGiven}</p>
                                </div>
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-50 text-orange-600 text-xl dark:bg-orange-900/30 dark:text-orange-400">❤️</span>
                                <div>
                                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Favorite Kitchen</p>
                                    <p className="font-semibold text-neutral-900 dark:text-neutral-50 truncate max-w-[150px]">{data.favoriteKitchen?.name || "None"}</p>
                                </div>
                            </li>
                        </ul>
                    </div>

                    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:bg-neutral-800 dark:border-neutral-700">
                        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-4">Status Breakdown</h2>
                        <div className="space-y-3">
                            <StatusRow label="Completed" count={data.statusBreakdown.COMPLETED} total={data.totalOrders} colorClass="bg-green-500" />
                            <StatusRow label="Pending" count={data.statusBreakdown.PENDING} total={data.totalOrders} colorClass="bg-amber-500" />
                            <StatusRow label="Accepted" count={data.statusBreakdown.ACCEPTED} total={data.totalOrders} colorClass="bg-blue-500" />
                            <StatusRow label="Cancelled" count={data.statusBreakdown.CANCELLED} total={data.totalOrders} colorClass="bg-red-500" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MetricCard({ title, value, icon }: { title: string, value: string | number, icon: string }) {
    return (
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:bg-neutral-800 dark:border-neutral-700 hover:shadow-md transition-shadow flex-1">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">{title}</p>
                    <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">{value}</p>
                </div>
                <span className="text-2xl">{icon}</span>
            </div>
        </div>
    );
}

function StatusRow({ label, count, total, colorClass }: { label: string, count: number, total: number, colorClass: string }) {
    const pct = total > 0 ? (count / total) * 100 : 0;
    return (
        <div>
            <div className="flex justify-between text-sm mb-1">
                <span className="text-neutral-600 dark:text-neutral-300">{label}</span>
                <span className="font-medium text-neutral-900 dark:text-neutral-100">{count}</span>
            </div>
            <div className="h-2 w-full bg-neutral-100 dark:bg-neutral-700 rounded-full overflow-hidden">
                <div className={`h-full ${colorClass}`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}
