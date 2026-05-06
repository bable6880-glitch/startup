"use client";

import { useAuth } from "@/lib/firebase/auth-context";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useKitchenSSE } from "@/hooks/use-kitchen-sse";
import { PlanWidget } from "@/components/plans/PlanWidget";
import { usePlanAccess } from "@/hooks/use-plan-access";

// ─── Types ────────────────────────────────────────────────────────────────────

type Kitchen = {
    id: string;
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

// ─── Order type extended to support real-time prepend ────────────────────────
type Order = {
    id: string;
    totalAmount: number;
    status: string;
};

// ─── Main Dashboard Component ─────────────────────────────────────────────────

function DashboardContent() {
    const { user, loading: authLoading, getIdToken } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const justRegistered = searchParams.get("registered") === "true";

    const [kitchen, setKitchen] = useState<Kitchen | null>(null);
    const [stats, setStats] = useState<Stats>({ totalOrders: 0, totalMeals: 0 });
    const [orders, setOrders] = useState<Order[]>([]);
    const [topBuyers, setTopBuyers] = useState<TopBuyer[]>([]);
    const [topFood, setTopFood] = useState<TopFood[]>([]);
    const [analyticsMonth, setAnalyticsMonth] = useState("");
    const [loading, setLoading] = useState(true);

    // ── PHASE 5: Check if Elite ──────────────────────────────────────────────
    const { data: planAccess } = usePlanAccess();
    const isElite = planAccess?.planId === 'elite';

    // ── PHASE 4 ADDED: Real-time toast state ──────────────────────────────────
    const [realtimeToast, setRealtimeToast] = useState<string | null>(null);

    // ── PHASE 4 ADDED: Handle new order arriving via SSE ─────────────────────
    const handleNewOrder = useCallback((payload: Record<string, unknown>) => {
        // 1. Build a new order object shaped like existing orders
        const newOrder: Order = {
            id: payload.orderId as string,
            status: "PENDING",
            totalAmount: payload.totalAmount as number,
        };

        // 2. Prepend to orders list (appears at top instantly, no refresh needed)
        setOrders((prev) => [newOrder, ...prev]);

        // 3. Increment the Orders stat card counter
        setStats((prev) => ({ ...prev, totalOrders: prev.totalOrders + 1 }));

        // 4. Show green toast notification (auto-dismisses after 5s)
        const msg = `🍽️ New order from ${payload.customerName} — Rs. ${Number(payload.totalAmount).toLocaleString()}`;
        setRealtimeToast(msg);
        setTimeout(() => setRealtimeToast(null), 5000);

        // 5. Play a short audio beep using Web Audio API (no library needed)
        try {
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 523; // C5 — pleasant notification tone
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.4);
        } catch {
            // Audio unavailable in this context — silently ignore
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ── PHASE 4 ADDED: Connect to SSE stream for this kitchen ────────────────
    const { connected } = useKitchenSSE({
        kitchenId: kitchen?.id ?? "",
        onNewOrder: handleNewOrder,
    });

    // ── PHASE 4 ADDED: Request browser notification permission on mount ───────
    useEffect(() => {
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }
    }, []);

    // ── Existing: Load all dashboard data ────────────────────────────────────
    const loadDashboard = useCallback(async () => {
        try {
            const token = await getIdToken();
            if (!token) return;

            // Step 1: Fetch kitchen info first (other fetches depend on kitchenId)
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

            // Step 2: Fire independent fetches in parallel
            const fetchPromises: Promise<void>[] = [];

            // Orders fetch (independent — only needs token)
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
                // Menu count fetch (needs kitchenId)
                fetchPromises.push(
                    fetch(`/api/kitchens/${kitchenId}/menu`).then(async (res) => {
                        if (res.ok) {
                            const menuData = await res.json();
                            setStats((prev) => ({ ...prev, totalMeals: (menuData.data || []).length }));
                        } else {
                            console.error(`[Dashboard] Failed to fetch menu for kitchen ${kitchenId}:`, res.status);
                        }
                    }).catch(err => console.error(`[Dashboard] Network error fetching menu:`, err))
                );

                // Analytics fetch (needs kitchenId + token)
                fetchPromises.push(
                    fetch(`/api/kitchens/${kitchenId}/analytics`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }).then(async (res) => {
                        if (res.ok) {
                            const analyticsData = await res.json();
                            setTopBuyers(analyticsData.data?.topBuyers || []);
                            setTopFood(analyticsData.data?.topFood || []);
                            setAnalyticsMonth(analyticsData.data?.month || "");
                        } else {
                            console.warn(`[Dashboard] Analytics fetch failed: ${res.status}`);
                        }
                    }).catch(() => { /* analytics non-critical */ })
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
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="animate-pulse-soft space-y-6">
                    <div className="h-8 w-48 rounded-lg animate-shimmer" />
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                        {[1, 2, 3].map((i) => <div key={i} className="h-28 rounded-2xl animate-shimmer" />)}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

            {/* ── PHASE 4 ADDED: Real-time toast notification (fixed, top-right) ── */}
            {realtimeToast && (
                <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-in slide-in-from-top-2">
                    <span className="text-sm font-medium">{realtimeToast}</span>
                    <button
                        onClick={() => setRealtimeToast(null)}
                        className="text-white/80 hover:text-white text-xl leading-none ml-1"
                    >
                        ×
                    </button>
                </div>
            )}

            {/* Success Banner */}
            {justRegistered && (
                <div className="mb-6 rounded-xl bg-accent-50 border border-accent-200 px-4 py-3 text-sm text-accent-800 animate-slide-up dark:bg-accent-900/30 dark:border-accent-800 dark:text-accent-300">
                    🎉 Kitchen registered successfully! Start adding meals to your menu.
                </div>
            )}

            {/* Header — PHASE 4: added Live/Reconnecting dot next to title */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-50">
                            Manage Your Tiffin Service & Home Cooked Food Business
                        </h1>
                        {/* ── PHASE 4 ADDED: SSE connection status indicator ── */}
                        {kitchen && (
                            <div className="flex items-center gap-1.5 text-xs">
                                {connected ? (
                                    <>
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                                        </span>
                                        <span className="text-green-600 font-medium">Live</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="h-2 w-2 rounded-full bg-gray-400 animate-pulse" />
                                        <span className="text-gray-400">Reconnecting...</span>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                    <p className="mt-1 text-neutral-500 dark:text-neutral-400">
                        Welcome back, {user?.name?.split(" ")[0]}
                    </p>
                </div>
                {kitchen && (
                    <Link
                        href={`/kitchen/${kitchen.id}`}
                        className="hidden sm:inline-flex rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-all dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300"
                    >
                        View Public Profile →
                    </Link>
                )}
            </div>

            {/* ── Strict Profile Banner ── */}
            {kitchen && (!kitchen.profileImageUrl || !kitchen.coverImageUrl) && (
                <div className="mb-8 rounded-xl border border-red-200 bg-red-50 p-4 shadow-sm sm:p-5 dark:border-red-900/50 dark:bg-red-900/20">
                    <div className="flex gap-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-base font-bold text-red-800 dark:text-red-400">Action Required: Upload Kitchen Images</h3>
                            <div className="mt-1 text-sm text-red-700 dark:text-red-300">
                                <p>Your kitchen profile is currently missing essential images. To build trust with customers and stand out in search results, you must upload both a <strong>Profile Image</strong> and a <strong>Cover Image</strong>.</p>
                            </div>
                            <div className="mt-4">
                                <Link
                                    href="/dashboard/settings"
                                    className="inline-flex items-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900 transition-colors"
                                >
                                    Upload Images Now →
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* No Kitchen */}
            {!kitchen && (
                <div className="text-center py-16 rounded-2xl border-2 border-dashed border-neutral-300 dark:border-neutral-600">
                    <span className="text-5xl block mb-4">👨‍🍳</span>
                    <h2 className="text-lg font-semibold text-neutral-700 dark:text-neutral-300">No kitchen registered yet</h2>
                    <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">Register your kitchen to start selling</p>
                    <Link
                        href="/become-a-cook"
                        className="mt-4 inline-block rounded-xl bg-primary-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-600 transition-all"
                    >
                        Register Kitchen
                    </Link>
                </div>
            )}

            {kitchen && (
                <>
                    {/* Plan Widget */}
                    <div className="mb-8">
                        <PlanWidget />
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                        <StatCard icon="⭐" label="Rating" value={Number(kitchen.avgRating) > 0 ? Number(kitchen.avgRating).toFixed(1) : "New"} />
                        <StatCard icon="💬" label="Reviews" value={String(kitchen.totalReviews || 0)} />
                        <StatCard icon="🍽️" label="Menu Items" value={String(stats.totalMeals)} />
                        <StatCard icon="📦" label="Orders" value={String(stats.totalOrders)} />
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8 mb-8">
                        <Link href="/dashboard/menu" className="rounded-2xl border border-neutral-200/60 bg-white p-4 shadow-sm hover:shadow-md transition-all group text-center dark:bg-neutral-800 dark:border-neutral-700">
                            <span className="text-2xl block">🍱</span>
                            <h3 className="mt-1 text-sm font-semibold text-neutral-900 group-hover:text-primary-600 dark:text-neutral-100">Menu</h3>
                        </Link>
                        <Link href="/dashboard/orders" className="rounded-2xl border border-neutral-200/60 bg-white p-4 shadow-sm hover:shadow-md transition-all group text-center relative dark:bg-neutral-800 dark:border-neutral-700">
                            <span className="text-2xl block">📦</span>
                            <h3 className="mt-1 text-sm font-semibold text-neutral-900 group-hover:text-primary-600 dark:text-neutral-100">Orders</h3>
                            {/* Real-time pending order count badge */}
                            {orders.filter(o => o.status === "PENDING").length > 0 && (
                                <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-lg ring-2 ring-white dark:ring-neutral-800 animate-bounce">
                                    {orders.filter(o => o.status === "PENDING").length}
                                </span>
                            )}
                        </Link>
                        <Link href="/dashboard/potluck" className="rounded-2xl border border-blue-200/60 bg-gradient-to-br from-blue-50 to-white p-4 shadow-sm hover:shadow-md transition-all group text-center dark:from-blue-900/20 dark:to-neutral-800 dark:border-blue-800">
                            <span className="text-2xl block">🍲</span>
                            <h3 className="mt-1 text-sm font-semibold text-blue-700 dark:text-blue-300">Potluck</h3>
                        </Link>
                        <Link href="/dashboard/khata" className="rounded-2xl border border-green-200/60 bg-gradient-to-br from-green-50 to-white p-4 shadow-sm hover:shadow-md transition-all group text-center dark:from-green-900/20 dark:to-neutral-800 dark:border-green-800">
                            <span className="text-2xl block">📒</span>
                            <h3 className="mt-1 text-sm font-semibold text-green-700 dark:text-green-300">Khata</h3>
                        </Link>
                        <Link href="/dashboard/reviews" className="rounded-2xl border border-neutral-200/60 bg-white p-4 shadow-sm hover:shadow-md transition-all group text-center dark:bg-neutral-800 dark:border-neutral-700">
                            <span className="text-2xl block">⭐</span>
                            <h3 className="mt-1 text-sm font-semibold text-neutral-900 group-hover:text-primary-600 dark:text-neutral-100">Reviews</h3>
                        </Link>
                        <Link href="/dashboard/settings" className="rounded-2xl border border-neutral-200/60 bg-white p-4 shadow-sm hover:shadow-md transition-all group text-center dark:bg-neutral-800 dark:border-neutral-700">
                            <span className="text-2xl block">⚙️</span>
                            <h3 className="mt-1 text-sm font-semibold text-neutral-900 group-hover:text-primary-600 dark:text-neutral-100">Settings</h3>
                        </Link>
                        <Link href="/dashboard/subscription" className="rounded-2xl border border-accent-200/60 bg-gradient-to-br from-accent-50 to-white p-4 shadow-sm hover:shadow-md transition-all group text-center dark:from-accent-900/20 dark:to-neutral-800 dark:border-accent-800">
                            <span className="text-2xl block">💎</span>
                            <h3 className="mt-1 text-sm font-semibold text-accent-700 dark:text-accent-300">Premium</h3>
                        </Link>
                        <Link href="/dashboard/ai-assistant" className="rounded-2xl border border-amber-200/60 bg-gradient-to-br from-amber-50 to-white p-4 shadow-sm hover:shadow-md transition-all group text-center dark:from-amber-900/20 dark:to-neutral-800 dark:border-amber-800">
                            <span className="text-2xl block">👨‍🍳</span>
                            <h3 className="mt-1 text-sm font-semibold text-amber-700 dark:text-amber-300">AI Chef</h3>
                        </Link>
                        {isElite && (
                            <Link href="/dashboard/elite" className="col-span-2 sm:col-span-4 lg:col-span-2 rounded-2xl border-2 border-purple-300/60 bg-gradient-to-r from-purple-50 to-pink-50 p-4 shadow-[0_0_15px_rgba(168,85,247,0.2)] hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:-translate-y-0.5 transition-all group flex items-center justify-center gap-3 dark:from-purple-900/30 dark:to-pink-900/30 dark:border-purple-700/50">
                                <span className="text-3xl animate-pulse-subtle">👑</span>
                                <div className="text-left">
                                    <h3 className="text-sm font-extrabold text-purple-700 dark:text-purple-400 uppercase tracking-wide">Elite Command</h3>
                                    <p className="text-[10px] text-purple-600/80 dark:text-purple-400/80 font-medium">Exclusive Features</p>
                                </div>
                            </Link>
                        )}
                        <Link href="/explore" className="rounded-2xl border border-primary-200/60 bg-gradient-to-br from-primary-50 to-white p-4 shadow-sm hover:shadow-md transition-all group text-center dark:from-primary-900/20 dark:to-neutral-800 dark:border-primary-800">
                            <span className="text-2xl block">🔍</span>
                            <h3 className="mt-1 text-sm font-semibold text-primary-700 dark:text-primary-300">Browse</h3>
                        </Link>
                    </div>

                    {/* ── Analytics Section ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        {/* Top Buyers This Month */}
                        <div className="rounded-2xl border border-neutral-200/60 bg-white p-6 shadow-sm dark:bg-neutral-800 dark:border-neutral-700">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-bold text-neutral-900 dark:text-neutral-50">🏆 Top Buyers</h2>
                                <span className="text-xs text-neutral-400 dark:text-neutral-500">{analyticsMonth}</span>
                            </div>
                            {topBuyers.length > 0 ? (
                                <div className="space-y-3">
                                    {topBuyers.map((buyer, i) => (
                                        <div key={buyer.customerId} className="flex items-center gap-3 rounded-xl bg-neutral-50 p-3 dark:bg-neutral-700/50">
                                            <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${i === 0 ? "bg-amber-100 text-amber-700" : "bg-neutral-200 text-neutral-600 dark:bg-neutral-600 dark:text-neutral-300"}`}>
                                                {i + 1}
                                            </span>
                                            {buyer.customerAvatar ? (
                                                <img src={buyer.customerAvatar} alt="" className="h-9 w-9 rounded-full object-cover" />
                                            ) : (
                                                <div className="h-9 w-9 rounded-full bg-primary-100 flex items-center justify-center text-sm font-bold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                                                    {buyer.customerName?.[0]?.toUpperCase() || "?"}
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm text-neutral-900 truncate dark:text-neutral-100">
                                                    {buyer.customerName || "Anonymous"}
                                                </p>
                                                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                                    {buyer.orderCount} order{buyer.orderCount !== 1 ? "s" : ""}
                                                </p>
                                            </div>
                                            <p className="font-bold text-sm text-accent-600 dark:text-accent-400">
                                                Rs. {Number(buyer.totalSpent).toLocaleString()}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-neutral-500 text-center py-6 dark:text-neutral-400">No orders this month yet</p>
                            )}
                        </div>

                        {/* Top Selling Food This Month */}
                        <div className="rounded-2xl border border-neutral-200/60 bg-white p-6 shadow-sm dark:bg-neutral-800 dark:border-neutral-700">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-bold text-neutral-900 dark:text-neutral-50">🔥 Top Selling Food</h2>
                                <span className="text-xs text-neutral-400 dark:text-neutral-500">{analyticsMonth}</span>
                            </div>
                            {topFood.length > 0 ? (
                                <div className="space-y-3">
                                    {topFood.slice(0, 5).map((food, i) => (
                                        <div key={food.mealId} className="flex items-center gap-3 rounded-xl bg-neutral-50 p-3 dark:bg-neutral-700/50">
                                            <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${i === 0 ? "bg-red-100 text-red-600" : i === 1 ? "bg-orange-100 text-orange-600" : "bg-neutral-200 text-neutral-600 dark:bg-neutral-600 dark:text-neutral-300"}`}>
                                                {i + 1}
                                            </span>
                                            {food.mealImage ? (
                                                <img src={food.mealImage} alt="" className="h-9 w-9 rounded-lg object-cover" />
                                            ) : (
                                                <div className="h-9 w-9 rounded-lg bg-orange-100 flex items-center justify-center text-sm dark:bg-orange-900/30">🍱</div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm text-neutral-900 truncate dark:text-neutral-100">{food.mealName}</p>
                                                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                                    {food.totalQuantity} sold · Rs. {Number(food.totalRevenue).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-neutral-500 text-center py-6 dark:text-neutral-400">No sales this month yet</p>
                            )}
                        </div>
                    </div>

                    {/* Recent Orders — PHASE 4: Added Accept button on PENDING orders */}
                    <section>
                        <h2 className="text-lg font-bold text-neutral-900 mb-4 dark:text-neutral-50">Recent Orders</h2>
                        {orders.length > 0 ? (
                            <div className="space-y-3">
                                {orders.slice(0, 5).map((order) => (
                                    <div
                                        key={order.id}
                                        className="rounded-xl border border-neutral-200/60 bg-white p-4 flex items-center justify-between dark:bg-neutral-800 dark:border-neutral-700"
                                    >
                                        <div>
                                            <p className="font-medium text-neutral-900 dark:text-neutral-100">
                                                Order #{order.id.slice(0, 8)}
                                            </p>
                                            <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                                Rs. {Number(order.totalAmount).toLocaleString()} · {order.status}
                                            </p>
                                        </div>

                                        {/* Right side: status badge + accept button */}
                                        <div className="flex items-center gap-2">
                                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${order.status === "COMPLETED" ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300" :
                                                order.status === "PENDING" ? "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" :
                                                    order.status === "ACCEPTED" ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" :
                                                        order.status === "CANCELLED" ? "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300" :
                                                            "bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300"
                                                }`}>
                                                {order.status}
                                            </span>

                                            {/* ── PHASE 4 ADDED: One-click Accept button for PENDING orders ── */}
                                            {order.status === "PENDING" && (
                                                <AcceptOrderButton
                                                    orderId={order.id}
                                                    onAccepted={() => {
                                                        setOrders((prev) =>
                                                            prev.map((o) =>
                                                                o.id === order.id
                                                                    ? { ...o, status: "ACCEPTED" }
                                                                    : o
                                                            )
                                                        );
                                                    }}
                                                />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-neutral-500 text-sm dark:text-neutral-400">No orders yet.</p>
                        )}
                    </section>
                </>
            )}

            {/* ── SEO Content Section ─────────────────────────────────────────── */}
            <section className="mt-12 rounded-2xl border border-neutral-200/60 bg-neutral-50/50 p-6 sm:p-8 dark:bg-neutral-800/50 dark:border-neutral-700">
                <h2 className="text-lg font-bold text-neutral-800 mb-3 dark:text-neutral-100">
                    Grow Your Tiffin Service Business
                </h2>
                <p className="text-sm text-neutral-500 leading-relaxed dark:text-neutral-400">
                    The Seller Dashboard helps you manage your tiffin service efficiently.
                    Track orders, update your menu,
                    and monitor performance for your home cooked food business in one place.
                </p>

                <h3 className="text-base font-semibold text-neutral-700 mt-5 mb-2 dark:text-neutral-200">
                    Manage Meal Delivery Orders Easily
                </h3>
                <p className="text-sm text-neutral-500 leading-relaxed dark:text-neutral-400">
                    View incoming meal delivery requests, update order status, and
                    communicate with customers directly.
                    The dashboard allows you to stay organized while scaling your monthly
                    tiffin service in Pakistan.
                </p>

                <h3 className="text-base font-semibold text-neutral-700 mt-5 mb-2 dark:text-neutral-200">
                    Optimize Your Home Cooked Food Listings
                </h3>
                <p className="text-sm text-neutral-500 leading-relaxed dark:text-neutral-400">
                    Add new meals, update prices, manage availability, and improve visibility
                    in search results.
                    Sellers can track performance and identify which dishes perform best in
                    local searches such as
                    home cooked food delivery near me.
                </p>
                <p className="text-sm text-neutral-500 leading-relaxed mt-4 dark:text-neutral-400">
                    Use analytics and premium features to improve ranking, increase repeat
                    customers, and grow your
                    meal delivery business consistently.
                </p>
            </section>
        </div>
    );
}

// ─── Stat Card (unchanged) ────────────────────────────────────────────────────

function StatCard({ icon, label, value }: { icon: string; label: string; value: string }) {
    return (
        <div className="rounded-2xl border border-neutral-200/60 bg-white p-5 shadow-sm dark:bg-neutral-800 dark:border-neutral-700">
            <div className="flex items-center gap-3">
                <span className="text-2xl">{icon}</span>
                <div>
                    <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">{value}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{label}</p>
                </div>
            </div>
        </div>
    );
}

// ─── PHASE 4 ADDED: Accept Order Button Component ─────────────────────────────

function AcceptOrderButton({
    orderId,
    onAccepted,
}: {
    orderId: string;
    onAccepted: () => void;
}) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleAccept = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/orders/${orderId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "ACCEPTED" }),
            });
            if (!res.ok) throw new Error("Failed");
            onAccepted(); // Instantly update local state — no refetch needed
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
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 border border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-900/20"
            >
                {loading && (
                    <span className="animate-spin h-3 w-3 border border-blue-500 border-t-transparent rounded-full" />
                )}
                {loading ? "Updating..." : "Accept"}
            </button>
            {error && (
                <p className="text-xs text-red-500 mt-1">{error}</p>
            )}
        </div>
    );
}

// ─── Page Wrapper (unchanged) ─────────────────────────────────────────────────

export default function DashboardPage() {
    return (
        <Suspense fallback={
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="animate-pulse-soft space-y-6">
                    <div className="h-8 w-48 rounded-lg animate-shimmer" />
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                        {[1, 2, 3].map((i) => <div key={i} className="h-28 rounded-2xl animate-shimmer" />)}
                    </div>
                </div>
            </div>
        }>
            <DashboardContent />
        </Suspense>
    );
}
