"use client";

import { useAuth } from "@/lib/firebase/auth-context";
import { useEffect, useState } from "react";
import { BackButton } from "@/components/ui/BackButton";
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, Receipt, BarChart3 } from "lucide-react";

interface AnalyticsData {
    summary: {
        thisMonth: { revenue: number; orderCount: number };
        lastMonth: { revenue: number; orderCount: number };
        revenueChangePercent: number | null;
    };
    commission: {
        totalOrderVolume: number;
        totalCommission: number;
        totalNetEarnings: number;
    };
    monthlyBreakdown: Array<{
        month: string;
        monthLabel: string;
        revenue: number;
        commission: number;
        netEarnings: number;
        orderCount: number;
    }>;
    topMeals: Array<{
        name: string;
        imageUrl: string | null;
        totalSold: number;
        totalRevenue: number;
    }>;
    dailyOrders: Array<{
        day: string;
        count: number;
        revenue: number;
    }>;
}

export default function SellerAnalyticsPage() {
    const { getIdToken, loading: authLoading } = useAuth();
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function load() {
            try {
                const token = await getIdToken();
                const res = await fetch("/api/seller/analytics", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const json = await res.json();
                if (res.ok && json.data) {
                    setData(json.data);
                } else {
                    setError(json.error || "Failed to load analytics");
                }
            } catch {
                setError("Network error");
            } finally {
                setLoading(false);
            }
        }
        if (!authLoading) load();
    }, [authLoading, getIdToken]);

    if (loading || authLoading) {
        return (
            <div className="mx-auto max-w-6xl px-4 py-8">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 w-48 rounded-lg bg-neutral-200 dark:bg-neutral-700" />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => <div key={i} className="h-28 rounded-2xl bg-neutral-200 dark:bg-neutral-700" />)}
                    </div>
                    <div className="h-64 rounded-2xl bg-neutral-200 dark:bg-neutral-700" />
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="mx-auto max-w-6xl px-4 py-16 text-center">
                <span className="text-5xl block mb-4">📊</span>
                <p className="text-neutral-500 dark:text-neutral-400">{error || "No data available"}</p>
            </div>
        );
    }

    const { summary, commission, monthlyBreakdown, topMeals, dailyOrders } = data;
    const maxDailyRevenue = Math.max(...dailyOrders.map(d => d.revenue), 1);

    return (
        <div className="mx-auto max-w-6xl px-4 py-8">
            <BackButton label="Dashboard" />

            <div className="mt-2 mb-8">
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Analytics & Earnings</h1>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Track your revenue, commissions, and sales performance.</p>
            </div>

            {/* ── KPI Cards ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <KPICard
                    icon={<DollarSign className="w-4 h-4" />}
                    label="This Month Revenue"
                    value={`Rs. ${summary.thisMonth.revenue.toLocaleString()}`}
                    change={summary.revenueChangePercent}
                    gradient="from-emerald-500 to-green-500"
                />
                <KPICard
                    icon={<ShoppingBag className="w-4 h-4" />}
                    label="Orders This Month"
                    value={String(summary.thisMonth.orderCount)}
                    subtitle={`Last month: ${summary.lastMonth.orderCount}`}
                    gradient="from-blue-500 to-indigo-500"
                />
                <KPICard
                    icon={<Receipt className="w-4 h-4" />}
                    label="Total Commission Paid"
                    value={`Rs. ${commission.totalCommission.toLocaleString()}`}
                    subtitle="Platform fees"
                    gradient="from-amber-500 to-orange-500"
                />
                <KPICard
                    icon={<BarChart3 className="w-4 h-4" />}
                    label="Net Earnings"
                    value={`Rs. ${commission.totalNetEarnings.toLocaleString()}`}
                    subtitle="After commissions"
                    gradient="from-violet-500 to-purple-500"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* ── Daily Revenue Chart ── */}
                <div className="lg:col-span-2 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:bg-neutral-800 dark:border-neutral-700">
                    <h2 className="text-sm font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-emerald-500" />
                        Daily Revenue This Month
                    </h2>
                    {dailyOrders.length > 0 ? (
                        <div className="flex items-end gap-1 h-40">
                            {Array.from({ length: 31 }, (_, i) => {
                                const day = String(i + 1).padStart(2, "0");
                                const found = dailyOrders.find(d => d.day === day);
                                const revenue = found?.revenue ?? 0;
                                const height = maxDailyRevenue > 0 ? (revenue / maxDailyRevenue) * 100 : 0;
                                return (
                                    <div key={day} className="flex-1 flex flex-col items-center group relative">
                                        <div
                                            className="w-full rounded-t bg-gradient-to-t from-emerald-500 to-emerald-400 dark:from-emerald-600 dark:to-emerald-500 
                                                       transition-all duration-300 hover:from-emerald-400 hover:to-emerald-300
                                                       min-h-[2px]"
                                            style={{ height: `${Math.max(height, 2)}%` }}
                                        />
                                        {/* Tooltip */}
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-neutral-900 text-white text-[10px] px-2 py-1 rounded-lg
                                                        whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                                            Rs. {revenue.toLocaleString()}
                                        </div>
                                        {(i + 1) % 5 === 0 && (
                                            <span className="text-[9px] text-neutral-400 mt-1">{i + 1}</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-sm text-neutral-400 text-center py-12">No revenue data yet this month</p>
                    )}
                </div>

                {/* ── Top Selling Meals ── */}
                <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:bg-neutral-800 dark:border-neutral-700">
                    <h2 className="text-sm font-bold text-neutral-900 dark:text-white mb-4">🔥 Top Sellers This Month</h2>
                    {topMeals.length > 0 ? (
                        <div className="space-y-3">
                            {topMeals.map((meal, i) => (
                                <div key={meal.name} className="flex items-center gap-3">
                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                                        ${i === 0 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" 
                                        : "bg-neutral-100 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400"}`}>
                                        {i + 1}
                                    </span>
                                    {meal.imageUrl ? (
                                        <img src={meal.imageUrl} alt="" className="w-8 h-8 rounded-lg object-cover" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center text-sm">🍱</div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-neutral-900 dark:text-white truncate">{meal.name}</p>
                                        <p className="text-xs text-neutral-500 dark:text-neutral-400">{meal.totalSold} sold</p>
                                    </div>
                                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                                        Rs. {meal.totalRevenue.toLocaleString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-neutral-400 text-center py-8">No sales this month yet</p>
                    )}
                </div>
            </div>

            {/* ── Monthly Breakdown Table ── */}
            <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden dark:bg-neutral-800 dark:border-neutral-700">
                <div className="p-6 pb-4">
                    <h2 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-amber-500" />
                        Monthly Commission Breakdown
                    </h2>
                </div>
                {monthlyBreakdown.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-t border-neutral-100 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/80">
                                    <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Month</th>
                                    <th className="text-right px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Orders</th>
                                    <th className="text-right px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Revenue</th>
                                    <th className="text-right px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Commission</th>
                                    <th className="text-right px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wider">Net Earnings</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
                                {monthlyBreakdown.map(row => (
                                    <tr key={row.month} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors">
                                        <td className="px-6 py-3.5 font-medium text-neutral-900 dark:text-white">{row.monthLabel} {row.month.split('-')[0]}</td>
                                        <td className="px-6 py-3.5 text-right text-neutral-600 dark:text-neutral-300">{row.orderCount}</td>
                                        <td className="px-6 py-3.5 text-right text-neutral-600 dark:text-neutral-300">Rs. {row.revenue.toLocaleString()}</td>
                                        <td className="px-6 py-3.5 text-right text-amber-600 dark:text-amber-400 font-medium">Rs. {row.commission.toLocaleString()}</td>
                                        <td className="px-6 py-3.5 text-right text-emerald-600 dark:text-emerald-400 font-bold">Rs. {row.netEarnings.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="px-6 pb-6">
                        <p className="text-sm text-neutral-400 text-center py-8">No commission data yet. Complete orders to see your earnings breakdown.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── KPI Card Component ──
function KPICard({ icon, label, value, change, subtitle, gradient }: {
    icon: React.ReactNode;
    label: string;
    value: string;
    change?: number | null;
    subtitle?: string;
    gradient: string;
}) {
    return (
        <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm dark:bg-neutral-800 dark:border-neutral-700">
            {/* Gradient accent */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient}`} />
            
            <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white mb-3`}>
                {icon}
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">{label}</p>
            <p className="text-xl font-bold text-neutral-900 dark:text-white">{value}</p>
            {change !== undefined && change !== null && (
                <div className={`flex items-center gap-1 mt-1.5 text-xs font-medium ${change >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                    {change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {Math.abs(change).toFixed(1)}% vs last month
                </div>
            )}
            {subtitle && !change && (
                <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">{subtitle}</p>
            )}
        </div>
    );
}
