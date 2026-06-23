"use client";

import { useAuth } from "@/lib/firebase/auth-context";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useKitchenSSE } from "@/hooks/use-kitchen-sse";
import { PlanWidget } from "@/components/plans/PlanWidget";
import { usePlanAccess, isPlanAtLeast, broadcastPlanUpdate } from "@/hooks/use-plan-access";
import { DashboardCard } from "@/components/dashboard/DashboardCard";
import { CircularProgress } from "@/components/dashboard/CircularProgress";
import { Sparkline } from "@/components/dashboard/Sparkline";
import {
    Users, ShoppingBag, Star, LayoutDashboard, UtensilsCrossed,
    TrendingUp, DollarSign, Package, CheckCircle, Clock, Search,
    Bot, Settings, CreditCard, Crown, ChevronRight, X
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

type Kitchen = {
    id: string;
    slug?: string | null;
    name: string;
    city: string;
    area: string;
    status: string;
    avgRating: number;
    totalReviews: number;
    isVerified: boolean;
    profileImageUrl: string | null;
    coverImageUrl: string | null;
};

type Stats = {
    totalOrders: number;
    totalMeals: number;
};

type TopBuyer = {
    customerId: string;
    customerName: string | null;
    customerAvatar: string | null;
    totalSpent: number;
    orderCount: number;
};

type TopFood = {
    mealId: string;
    mealName: string;
    mealImage: string | null;
    totalQuantity: number;
    totalRevenue: number;
};

type Order = {
    id: string;
    totalAmount: number;
    status: string;
};

// ─── Mock Chart Data (Since API doesn't return time series yet) ──────────────
const revenueData = [
    { name: "Mon", revenue: 4000 },
    { name: "Tue", revenue: 3000 },
    { name: "Wed", revenue: 2000 },
    { name: "Thu", revenue: 2780 },
    { name: "Fri", revenue: 1890 },
    { name: "Sat", revenue: 2390 },
    { name: "Sun", revenue: 3490 },
];

const conversionSparkline = [30, 40, 35, 50, 49, 60, 70, 91, 125];
const revenueSparkline = [400, 300, 200, 278, 189, 239, 349];

// ─── Accept Order Button ──────────────────────────────────────────────────────

function AcceptOrderButton({
    orderId,
    onAccepted,
}: {
    orderId: string;
    onAccepted: () => void;
}) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { getIdToken } = useAuth();

    const handleAccept = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = await getIdToken();
            const res = await fetch(`/api/orders/${orderId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ status: "ACCEPTED" }),
            });
            if (!res.ok) throw new Error("Failed");
            onAccepted();
        } catch {
            setError("Failed");
            setTimeout(() => setError(null), 3000);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-end">
            <button
                onClick={handleAccept}
                disabled={loading}
                className="inline-flex items-center gap-1.5 text-[11px] px-3 py-1.5 border border-[#7367F0] text-[#7367F0] rounded-[6px] hover:bg-[rgba(115,103,240,0.08)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontWeight: 600 }}
            >
                {loading && (
                    <span className="animate-spin h-3 w-3 border border-[#7367F0] border-t-transparent rounded-full" />
                )}
                {loading ? "Updating..." : "Accept"}
            </button>
            {error && (
                <p className="text-[10px] text-[#EA5455] mt-1">{error}</p>
            )}
        </div>
    );
}

// ─── Main Dashboard Component ─────────────────────────────────────────────────

function DashboardContent() {
    const { user, loading: authLoading, getIdToken } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const justRegistered = searchParams.get("registered") === "true";
    const justSubscribed = searchParams.get("subscribed") === "true";
    const newPlan = searchParams.get("plan");

    const [kitchen, setKitchen] = useState<Kitchen | null>(null);
    const [stats, setStats] = useState<Stats>({ totalOrders: 0, totalMeals: 0 });
    const [orders, setOrders] = useState<Order[]>([]);
    const [topBuyers, setTopBuyers] = useState<TopBuyer[]>([]);
    const [topFood, setTopFood] = useState<TopFood[]>([]);
    const [analyticsMonth, setAnalyticsMonth] = useState("");
    const [loading, setLoading] = useState(true);

    const { data: planAccess } = usePlanAccess();
    const isElite = isPlanAtLeast(planAccess?.planId ?? null, 'elite');
    const [realtimeToast, setRealtimeToast] = useState<string | null>(null);

    useEffect(() => {
        if (justSubscribed && newPlan) {
            broadcastPlanUpdate();
            setRealtimeToast(`🎉 Welcome to ${newPlan}! Your kitchen is now active.`);

            const url = new URL(window.location.href);
            url.searchParams.delete('subscribed');
            url.searchParams.delete('plan');
            window.history.replaceState({}, '', url.toString());
        }
    }, [justSubscribed, newPlan]);

    const handleNewOrder = useCallback((payload: Record<string, unknown>) => {
        const newOrder: Order = {
            id: payload.orderId as string,
            status: "PENDING",
            totalAmount: payload.totalAmount as number,
        };

        setOrders((prev) => [newOrder, ...prev]);
        setStats((prev) => ({ ...prev, totalOrders: prev.totalOrders + 1 }));

        const msg = `🍽️ New order from ${payload.customerName} — Rs. ${Number(payload.totalAmount).toLocaleString()}`;
        setRealtimeToast(msg);
        setTimeout(() => setRealtimeToast(null), 5000);

        try {
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 523;
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.4);
        } catch {}
    }, []);

    const { connected } = useKitchenSSE({
        kitchenId: kitchen?.id ?? "",
        onNewOrder: handleNewOrder,
    });

    useEffect(() => {
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }
    }, []);

    const loadDashboard = useCallback(async () => {
        try {
            const token = await getIdToken();
            if (!token) return;

            const kitchenRes = await fetch("/api/kitchens?ownerId=me", {
                headers: { Authorization: `Bearer ${token}` },
            });

            let kitchenId: string | null = null;

            if (kitchenRes.ok) {
                const kitchenData = await kitchenRes.json();
                const kitchens = kitchenData.data || [];
                if (kitchens.length > 0) {
                    setKitchen(kitchens[0]);
                    kitchenId = kitchens[0].id;
                }
            }

            const fetchPromises: Promise<void>[] = [];

            fetchPromises.push(
                fetch("/api/orders", {
                    headers: { Authorization: `Bearer ${token}` },
                }).then(async (res) => {
                    if (res.ok) {
                        const ordersData = await res.json();
                        const items = ordersData.data || [];
                        setOrders(items);
                        setStats((prev) => ({ ...prev, totalOrders: items.length }));
                    }
                })
            );

            if (kitchenId) {
                fetchPromises.push(
                    fetch(`/api/kitchens/${kitchenId}/menu`).then(async (res) => {
                        if (res.ok) {
                            const menuData = await res.json();
                            setStats((prev) => ({ ...prev, totalMeals: (menuData.data || []).length }));
                        }
                    }).catch(() => {})
                );

                fetchPromises.push(
                    fetch(`/api/kitchens/${kitchenId}/analytics`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }).then(async (res) => {
                        if (res.ok) {
                            const analyticsData = await res.json();
                            setTopBuyers(analyticsData.data?.topBuyers || []);
                            setTopFood(analyticsData.data?.topFood || []);
                            setAnalyticsMonth(analyticsData.data?.month || "");
                        }
                    }).catch(() => {})
                );
            }

            await Promise.all(fetchPromises);
        } catch (err) {
            console.error("Dashboard load error:", err);
        } finally {
            setLoading(false);
        }
    }, [getIdToken]);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login?redirect=/dashboard");
            return;
        }
        if (user) loadDashboard();
    }, [user, authLoading, router, loadDashboard]);

    if (authLoading || loading) {
        return (
            <div className="mx-auto max-w-7xl p-6 sm:p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => <div key={i} className="h-[120px] dash-skeleton" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-7xl p-6 sm:p-8 pb-20">

            {/* ── Real-time toast notification ── */}
            {realtimeToast && (
                <div className="fixed top-6 right-6 z-[60] bg-[#28C76F] text-[#ffffff] px-5 py-3 rounded-xl shadow-[0_8px_20px_rgba(40,199,111,0.25)] flex items-center gap-3 animate-in slide-in-from-top-2">
                    <span className="text-[13px] font-medium tracking-wide">{realtimeToast}</span>
                    <button
                        onClick={() => setRealtimeToast(null)}
                        className="text-white/80 hover:text-white text-lg leading-none ml-1 focus:outline-none"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* ── Kitchen Lock Banner ── */}
            {planAccess?.isKitchenLocked && (
                <DashboardCard padding="md" style={{ borderColor: "rgba(234,84,85,0.3)", background: "rgba(234,84,85,0.05)", marginBottom: 24 }}>
                    <div className="flex gap-4">
                        <span className="text-3xl flex-shrink-0">🔒</span>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-base font-bold text-[#EA5455]">
                                Your Kitchen is Locked
                            </h3>
                            <p className="mt-1 text-[13px] text-[#B4B7BD]">
                                {planAccess.lockReason === 'ORDER_LIMIT_REACHED'
                                    ? "You've used all your monthly orders. Buy more capacity or upgrade your plan."
                                    : planAccess.lockReason === 'SUBSCRIPTION_EXPIRED'
                                        ? "Your subscription has expired. Renew now to keep accepting orders."
                                        : "Your kitchen is temporarily locked. Please contact support."}
                            </p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                <Link href="/dashboard/subscription" className="inline-flex items-center rounded-lg bg-[#EA5455] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#d64748] transition-colors">
                                    Manage Subscription <ChevronRight size={14} className="ml-1" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </DashboardCard>
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-[#D0D2D6] tracking-tight">
                        Kitchen Overview
                    </h1>
                    <p className="mt-1 text-[13px] text-[#676D7D]">
                        Track your performance and manage your tiffin service
                    </p>
                </div>
                {kitchen && (
                    <Link
                        href={`/kitchen/${kitchen.slug ?? kitchen.id}`}
                        className="hidden sm:inline-flex items-center gap-2 rounded-lg bg-[rgba(115,103,240,0.12)] px-4 py-2 text-[13px] font-semibold text-[#7367F0] hover:bg-[rgba(115,103,240,0.2)] transition-colors"
                    >
                        View Public Profile <ChevronRight size={14} />
                    </Link>
                )}
            </div>

            {/* No Kitchen */}
            {!kitchen && (
                <DashboardCard padding="lg" style={{ textAlign: "center", padding: "64px 20px" }}>
                    <UtensilsCrossed size={48} className="mx-auto text-[#676D7D] mb-4 opacity-50" />
                    <h2 className="text-lg font-semibold text-[#D0D2D6]">No kitchen registered yet</h2>
                    <p className="mt-2 text-[13px] text-[#676D7D]">Register your kitchen to start selling</p>
                    <Link
                        href="/become-a-cook"
                        className="mt-6 inline-flex rounded-lg bg-[#7367F0] px-6 py-2.5 text-[13px] font-semibold text-white hover:bg-[#685dd8] transition-colors"
                    >
                        Register Kitchen
                    </Link>
                </DashboardCard>
            )}

            {kitchen && (
                <>
                    {/* Plan Widget */}
                    <div className="mb-6">
                        <PlanWidget />
                    </div>

                    {/* ── Frest Stats Grid ── */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                        
                        {/* Circular Progress: Orders */}
                        <DashboardCard padding="md" className="flex items-center justify-between">
                            <div>
                                <h3 className="text-[#676D7D] text-[13px] font-medium mb-1">Total Orders</h3>
                                <div className="text-2xl font-bold text-[#D0D2D6] mb-2">{stats.totalOrders}</div>
                                <span className="badge-success">+12.5%</span>
                            </div>
                            <CircularProgress percentage={75} color="#28C76F">
                                <Package size={20} color="#28C76F" />
                            </CircularProgress>
                        </DashboardCard>

                        {/* Circular Progress: Menu Items */}
                        <DashboardCard padding="md" className="flex items-center justify-between">
                            <div>
                                <h3 className="text-[#676D7D] text-[13px] font-medium mb-1">Menu Items</h3>
                                <div className="text-2xl font-bold text-[#D0D2D6] mb-2">{stats.totalMeals}</div>
                                <span className="badge-warning">Active</span>
                            </div>
                            <CircularProgress percentage={stats.totalMeals > 0 ? 100 : 0} color="#FF9F43">
                                <UtensilsCrossed size={20} color="#FF9F43" />
                            </CircularProgress>
                        </DashboardCard>

                        {/* Sparkline: Revenue */}
                        <DashboardCard padding="md">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="text-[#676D7D] text-[13px] font-medium mb-1">Revenue</h3>
                                    <div className="text-2xl font-bold text-[#D0D2D6]">
                                        Rs. {(stats.totalOrders * 350).toLocaleString()} {/* Mock math for UI */}
                                    </div>
                                </div>
                                <div className="p-2 rounded-lg bg-[rgba(115,103,240,0.12)]">
                                    <DollarSign size={18} color="#7367F0" />
                                </div>
                            </div>
                            <div className="mt-4 -ml-2 -mb-2">
                                <Sparkline data={revenueSparkline} color="#7367F0" width={180} height={40} />
                            </div>
                        </DashboardCard>

                        {/* Sparkline: Conversion (Rating Mock) */}
                        <DashboardCard padding="md">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="text-[#676D7D] text-[13px] font-medium mb-1">Rating</h3>
                                    <div className="text-2xl font-bold text-[#D0D2D6]">
                                        {Number(kitchen.avgRating) > 0 ? Number(kitchen.avgRating).toFixed(1) : "New"}
                                    </div>
                                </div>
                                <div className="p-2 rounded-lg bg-[rgba(0,207,232,0.12)]">
                                    <Star size={18} color="#00CFE8" />
                                </div>
                            </div>
                            <div className="mt-4 -ml-2 -mb-2">
                                <Sparkline data={conversionSparkline} color="#00CFE8" width={180} height={40} />
                            </div>
                        </DashboardCard>
                    </div>

                    {/* ── Main Chart & Recent Orders ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                        
                        {/* Revenue Chart */}
                        <DashboardCard padding="lg" className="lg:col-span-2 flex flex-col">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h2 className="text-[15px] font-semibold text-[#D0D2D6]">Revenue Overview</h2>
                                    <p className="text-[12px] text-[#676D7D]">Last 7 Days</p>
                                </div>
                            </div>
                            <div className="flex-1 min-h-[250px] -ml-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={revenueData}>
                                        <defs>
                                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#7367F0" stopOpacity={0.3}/>
                                                <stop offset="95%" stopColor="#7367F0" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                        <XAxis dataKey="name" stroke="#676D7D" fontSize={11} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#676D7D" fontSize={11} tickLine={false} axisLine={false} />
                                        <RechartsTooltip 
                                            contentStyle={{ backgroundColor: "#283046", borderColor: "rgba(255,255,255,0.06)", borderRadius: '8px', fontSize: '12px' }}
                                            itemStyle={{ color: '#D0D2D6' }}
                                        />
                                        <Area type="monotone" dataKey="revenue" stroke="#7367F0" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </DashboardCard>

                        {/* Recent Orders List */}
                        <DashboardCard padding="md" className="flex flex-col">
                            <div className="flex justify-between items-center mb-5">
                                <h2 className="text-[15px] font-semibold text-[#D0D2D6]">Recent Orders</h2>
                                <Link href="/dashboard/orders" className="text-[12px] text-[#7367F0] font-medium hover:underline">View All</Link>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto pr-2">
                                {orders.length > 0 ? (
                                    <div className="space-y-4">
                                        {orders.slice(0, 5).map((order) => (
                                            <div key={order.id} className="flex items-center justify-between pb-4 border-b border-[rgba(255,255,255,0.06)] last:border-0 last:pb-0">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-[rgba(115,103,240,0.12)] flex items-center justify-center">
                                                        <ShoppingBag size={18} color="#7367F0" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[13px] font-medium text-[#D0D2D6]">#{order.id.slice(0, 8)}</p>
                                                        <p className="text-[11px] text-[#676D7D]">Rs. {Number(order.totalAmount).toLocaleString()}</p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    <span className={
                                                        order.status === "COMPLETED" ? "badge-success" :
                                                        order.status === "PENDING" ? "badge-warning" :
                                                        order.status === "ACCEPTED" ? "badge-info" :
                                                        order.status === "CANCELLED" ? "badge-danger" :
                                                        "badge-purple"
                                                    }>
                                                        {order.status}
                                                    </span>
                                                    {order.status === "PENDING" && (
                                                        <AcceptOrderButton
                                                            orderId={order.id}
                                                            onAccepted={() => {
                                                                setOrders((prev) => prev.map((o) => o.id === order.id ? { ...o, status: "ACCEPTED" } : o));
                                                            }}
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-center opacity-50 py-8">
                                        <Package size={32} className="text-[#676D7D] mb-2" />
                                        <p className="text-[13px] text-[#676D7D]">No orders yet.</p>
                                    </div>
                                )}
                            </div>
                        </DashboardCard>
                    </div>

                    {/* ── Top Analytics (Food & Buyers) ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        
                        {/* Top Buyers */}
                        <DashboardCard padding="md">
                            <div className="flex justify-between items-center mb-5">
                                <h2 className="text-[15px] font-semibold text-[#D0D2D6]">Top Customers</h2>
                                <span className="text-[12px] text-[#676D7D]">{analyticsMonth || "This Month"}</span>
                            </div>
                            
                            <div className="space-y-4">
                                {topBuyers.length > 0 ? topBuyers.slice(0,4).map((buyer, i) => (
                                    <div key={buyer.customerId} className="flex items-center gap-4">
                                        {buyer.customerAvatar ? (
                                            <img src={buyer.customerAvatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-[rgba(115,103,240,0.12)] flex items-center justify-center text-[13px] font-bold text-[#7367F0]">
                                                {buyer.customerName?.[0]?.toUpperCase() || "?"}
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[13px] font-semibold text-[#D0D2D6] truncate">{buyer.customerName || "Anonymous"}</p>
                                            <p className="text-[11px] text-[#676D7D]">{buyer.orderCount} Orders</p>
                                        </div>
                                        <p className="text-[13px] font-bold text-[#28C76F]">
                                            Rs. {Number(buyer.totalSpent).toLocaleString()}
                                        </p>
                                    </div>
                                )) : (
                                    <p className="text-[13px] text-[#676D7D] text-center py-6">No customer data available yet.</p>
                                )}
                            </div>
                        </DashboardCard>

                        {/* Top Food */}
                        <DashboardCard padding="md">
                            <div className="flex justify-between items-center mb-5">
                                <h2 className="text-[15px] font-semibold text-[#D0D2D6]">Popular Items</h2>
                                <span className="text-[12px] text-[#676D7D]">{analyticsMonth || "This Month"}</span>
                            </div>
                            
                            <div className="space-y-4">
                                {topFood.length > 0 ? topFood.slice(0,4).map((food, i) => (
                                    <div key={food.mealId} className="flex items-center gap-4">
                                        {food.mealImage ? (
                                            <img src={food.mealImage} alt="" className="w-10 h-10 rounded-lg object-cover" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-lg bg-[rgba(255,159,67,0.12)] flex items-center justify-center">
                                                <UtensilsCrossed size={18} color="#FF9F43" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[13px] font-semibold text-[#D0D2D6] truncate">{food.mealName}</p>
                                            <p className="text-[11px] text-[#676D7D]">{food.totalQuantity} Sold</p>
                                        </div>
                                        <p className="text-[13px] font-bold text-[#D0D2D6]">
                                            Rs. {Number(food.totalRevenue).toLocaleString()}
                                        </p>
                                    </div>
                                )) : (
                                    <p className="text-[13px] text-[#676D7D] text-center py-6">No sales data available yet.</p>
                                )}
                            </div>
                        </DashboardCard>
                    </div>

                </>
            )}
        </div>
    );
}

export default function DashboardPage() {
    return (
        <Suspense fallback={
            <div className="mx-auto max-w-7xl p-6 sm:p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => <div key={i} className="h-[120px] dash-skeleton" />)}
                </div>
            </div>
        }>
            <DashboardContent />
        </Suspense>
    );
}
