"use client";

import { useAuth } from "@/lib/firebase/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import { OrderCard } from "@/components/dashboard/OrderCard";
import { useKitchenSSE } from "@/hooks/use-kitchen-sse";
import { usePlanAccess } from "@/hooks/use-plan-access";
import { KitchenLockedModal } from "@/components/plans/KitchenLockedModal";
import Link from "next/link";
import { BackButton } from "@/components/ui/BackButton";

export default function SellerOrdersPage() {
    const { user, loading: authLoading, getIdToken } = useAuth();
    const router = useRouter();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [kitchenId, setKitchenId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"PENDING" | "ACTIVE" | "HISTORY">("PENDING");
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

    const filteredOrders = orders.filter(order => {
        if (activeTab === "PENDING") return order.status === "PENDING";
        if (activeTab === "ACTIVE") return order.status === "ACCEPTED";
        if (activeTab === "HISTORY") return ["COMPLETED", "CANCELLED"].includes(order.status);
        return true;
    });

    if (authLoading || loading) {
        return (
            <div className="mx-auto max-w-5xl px-4 py-8">
                <div className="h-8 w-48 rounded bg-neutral-200 animate-pulse mb-8" />
                <div className="space-y-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-40 rounded-xl bg-neutral-100 animate-pulse" />)}
                </div>
            </div>
        );
    }

    if (!kitchenId) {
        return (
            <div className="mx-auto max-w-5xl px-4 py-16 text-center">
                <h2 className="text-xl font-bold">No Kitchen Found</h2>
                <p className="mt-2 text-neutral-500">You need to register a kitchen to receive orders.</p>
                <Link href="/become-a-cook" className="mt-4 inline-block btn-primary">Create Kitchen</Link>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-5xl px-4 py-8">
            {/* Kitchen Locked Overlay */}
            {planAccess && (planAccess as any).isKitchenLocked && (
                <KitchenLockedModal lockReason={(planAccess as any).lockReason || 'ORDER_LIMIT_REACHED'} />
            )}
            <BackButton label="Dashboard" />
            <div className="flex items-center justify-between mb-8 mt-2">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">Kitchen Orders</h1>
                    <p className="text-neutral-500 dark:text-neutral-400">Manage your incoming food orders</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 rounded-full border border-neutral-100 bg-white px-3 py-1.5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                        <span className={`relative flex h-2 w-2`}>
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
                        className="p-2 text-neutral-500 hover:bg-neutral-100 rounded-lg transition-colors dark:text-neutral-400 dark:hover:bg-neutral-800"
                        title="Refresh Orders"
                    >
                        🔄
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-neutral-200 mb-6 dark:border-neutral-800">
                {(["PENDING", "ACTIVE", "HISTORY"] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab
                                ? "border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400"
                                : "border-transparent text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                            }`}
                    >
                        {tab === "HISTORY" ? "Past Orders" : tab.charAt(0) + tab.slice(1).toLowerCase()}
                        {tab === "PENDING" && orders.filter(o => o.status === "PENDING").length > 0 && (
                            <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600 dark:bg-red-900/30 dark:text-red-300">
                                {orders.filter(o => o.status === "PENDING").length}
                            </span>
                        )}
                        {tab === "ACTIVE" && orders.filter(o => o.status === "ACCEPTED").length > 0 && (
                            <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
                                {orders.filter(o => o.status === "ACCEPTED").length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* List */}
            <div className="space-y-4">
                {filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => (
                        <OrderCard key={order.id} order={order} getToken={getIdToken} onStatusChange={handleOrderStatusChange} />
                    ))
                ) : (
                    <div className="text-center py-12 rounded-xl border-2 border-dashed border-neutral-200 dark:border-neutral-700">
                        <p className="text-neutral-500 dark:text-neutral-400">No {activeTab.toLowerCase()} orders found.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
