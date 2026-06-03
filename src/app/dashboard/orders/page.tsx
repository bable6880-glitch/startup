"use client";

import { useAuth } from "@/lib/firebase/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useMemo } from "react";
import { OrderCard } from "@/components/dashboard/OrderCard";
import { useKitchenSSE } from "@/hooks/use-kitchen-sse";
import { usePlanAccess } from "@/hooks/use-plan-access";
import { KitchenLockedModal } from "@/components/plans/KitchenLockedModal";
import Link from "next/link";
import { BackButton } from "@/components/ui/BackButton";

type TabKey = "PENDING" | "ACTIVE" | "HISTORY";

const TAB_CONFIG: Record<TabKey, { label: string; statusFilter: string[]; emptyIcon: string; emptyText: string }> = {
    PENDING: { label: "Pending", statusFilter: ["PENDING"], emptyIcon: "📭", emptyText: "No pending orders — you're all caught up!" },
    ACTIVE: { label: "Active", statusFilter: ["ACCEPTED"], emptyIcon: "👨‍🍳", emptyText: "No active orders right now." },
    HISTORY: { label: "Past Orders", statusFilter: ["COMPLETED", "CANCELLED"], emptyIcon: "📋", emptyText: "No order history yet." },
};

export default function SellerOrdersPage() {
    const { user, loading: authLoading, getIdToken } = useAuth();
    const router = useRouter();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [kitchenId, setKitchenId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<TabKey>("PENDING");
    const { data: planAccess } = usePlanAccess();

    const fetchOrders = useCallback(async () => {
        try {
            const token = await getIdToken();
            if (!token) return;

            // 1. Get Kitchen ID if not already known
            let kId = kitchenId;
            if (!kId) {
                const kitchenRes = await fetch("/api/kitchens?ownerId=me", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (kitchenRes.ok) {
                    const data = await kitchenRes.json();
                    if (data.data && data.data.length > 0) {
                        kId = data.data[0].id;
                        setKitchenId(kId);
                    }
                }
            }

            if (!kId) {
                setLoading(false);
                return; // No kitchen found
            }

            // 2. Fetch Orders
            const res = await fetch(`/api/kitchens/${kId}/orders`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                setOrders(data.data || []);
            }
        } catch (error) {
            console.error("Failed to fetch orders", error);
        } finally {
            setLoading(false);
        }
    }, [getIdToken, kitchenId]);

    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push("/seller/login");
            } else {
                fetchOrders();
            }
        }
    }, [user, authLoading, router, fetchOrders]);

    // Real-Time SSE integration
    const handleSseOrderChange = useCallback(() => {
        // Re-fetch all orders when SSE fires — keeps data in sync
        fetchOrders();
    }, [fetchOrders]);

    const { connected } = useKitchenSSE({
        kitchenId,
        onNewOrder: handleSseOrderChange,
        onOrderStatusChanged: handleSseOrderChange,
    });

    // Optimistic status change — move card between tabs instantly
    const handleOrderStatusChange = useCallback((orderId: string, newStatus: string) => {
        setOrders(prev => prev.map(o => 
            o.id === orderId ? { ...o, status: newStatus } : o
        ));
        
        // Auto-switch tab to show where the order went
        if (newStatus === "ACCEPTED") {
            setActiveTab("ACTIVE");
        } else if (newStatus === "COMPLETED" || newStatus === "CANCELLED") {
            setActiveTab("HISTORY");
        }
    }, []);

    // Memoized counts per tab
    const tabCounts = useMemo(() => ({
        PENDING: orders.filter(o => o.status === "PENDING").length,
        ACTIVE: orders.filter(o => o.status === "ACCEPTED").length,
        HISTORY: orders.filter(o => ["COMPLETED", "CANCELLED"].includes(o.status)).length,
    }), [orders]);

    const filteredOrders = useMemo(() => {
        const config = TAB_CONFIG[activeTab];
        return orders.filter(order => config.statusFilter.includes(order.status));
    }, [orders, activeTab]);

    if (authLoading || loading) {
        return (
            <div className="mx-auto max-w-5xl px-4 py-8">
                <div className="h-6 w-24 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse mb-4" />
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <div className="h-8 w-48 rounded-lg bg-neutral-200 dark:bg-neutral-800 animate-pulse mb-2" />
                        <div className="h-4 w-64 rounded bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
                    </div>
                    <div className="h-8 w-20 rounded-full bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
                </div>
                <div className="flex gap-1 mb-6">
                    {[1, 2, 3].map(i => <div key={i} className="h-10 w-28 rounded-lg bg-neutral-100 dark:bg-neutral-800 animate-pulse" />)}
                </div>
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-48 rounded-xl bg-neutral-100 dark:bg-neutral-800 animate-pulse skeleton-shimmer" />
                    ))}
                </div>
            </div>
        );
    }

    if (!kitchenId) {
        return (
            <div className="mx-auto max-w-5xl px-4 py-16 text-center animate-fade-in-up">
                <span className="text-5xl block mb-4">🍳</span>
                <h2 className="text-xl font-bold text-neutral-900 dark:text-white">No Kitchen Found</h2>
                <p className="mt-2 text-neutral-500 dark:text-neutral-400">You need to register a kitchen to receive orders.</p>
                <Link href="/become-a-cook" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-3 text-sm font-bold text-white hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/20">
                    Create Kitchen →
                </Link>
            </div>
        );
    }

    const currentTabConfig = TAB_CONFIG[activeTab];

    return (
        <div className="mx-auto max-w-5xl px-4 py-8 animate-fade-in-up">
            {/* Kitchen Locked Overlay */}
            {planAccess && (planAccess as any).isKitchenLocked && (
                <KitchenLockedModal lockReason={(planAccess as any).lockReason || 'ORDER_LIMIT_REACHED'} />
            )}
            <BackButton label="Dashboard" />
            <div className="flex items-center justify-between mb-8 mt-2">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Kitchen Orders</h1>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">Manage your incoming food orders</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 rounded-full border border-neutral-100 bg-white px-3 py-1.5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                        <span className="relative flex h-2 w-2">
                            {connected && (
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                            )}
                            <span className={`relative inline-flex h-2 w-2 rounded-full ${connected ? 'bg-green-500' : 'bg-neutral-400'}`}></span>
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                            {connected ? "Live" : "Connecting"}
                        </span>
                    </div>

                    <button
                        onClick={() => fetchOrders()}
                        className="w-9 h-9 flex items-center justify-center text-neutral-500 hover:bg-neutral-100 rounded-lg transition-colors dark:text-neutral-400 dark:hover:bg-neutral-800"
                        title="Refresh Orders"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Tabs — pill style */}
            <div className="flex gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl mb-6">
                {(["PENDING", "ACTIVE", "HISTORY"] as const).map((tab) => {
                    const count = tabCounts[tab];
                    const isActive = activeTab === tab;
                    return (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`relative flex-1 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${isActive
                                    ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-white"
                                    : "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                                }`}
                        >
                            {TAB_CONFIG[tab].label}
                            {count > 0 && (
                                <span className={`ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold ${
                                    tab === "PENDING" ? "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300" :
                                    tab === "ACTIVE" ? "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300" :
                                    "bg-neutral-200 text-neutral-600 dark:bg-neutral-600 dark:text-neutral-300"
                                }`}>
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* List */}
            <div className="space-y-4 stagger-children">
                {filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => (
                        <OrderCard key={order.id} order={order} getToken={getIdToken} onStatusChange={handleOrderStatusChange} />
                    ))
                ) : (
                    <div className="text-center py-16 rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-700 animate-fade-in-up">
                        <span className="text-4xl block mb-3">{currentTabConfig.emptyIcon}</span>
                        <p className="text-neutral-500 dark:text-neutral-400 font-medium">{currentTabConfig.emptyText}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
