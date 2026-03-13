"use client";

import { useAuth } from "@/lib/firebase/auth-context";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useCustomerSSE } from "@/hooks/use-customer-sse";
import { StatCard } from "@/components/dashboard/buyer/StatCard";
import { SectionHeader } from "@/components/dashboard/buyer/SectionHeader";

type Order = {
    id: string;
    status: string;
    totalAmount: number;
    createdAt: string;
    kitchen?: { name: string; city: string };
    items?: Array<{ meal?: { name: string }; quantity: number }>;
};

type Analytics = {
    totalOrders: number;
    totalSpent: number;
    totalReviews: number;
    kitchensTried: number;
};

type Notification = {
    id: string; title: string; body: string; isRead: boolean; createdAt: string; link?: string;
};

type Favorite = {
    favoriteId: string; kitchen: { name: string; city: string; avgRating: number };
};

function statusBadge(status: string) {
    const map: Record<string, string> = {
        PENDING: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
        ACCEPTED: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
        COMPLETED: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300",
        CANCELLED: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    };
    return map[status] ?? "bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300";
}

export default function AccountPage() {
    const { user, getIdToken } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [favorites, setFavorites] = useState<Favorite[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const load = async () => {
            try {
                const token = await getIdToken();
                const headers = { Authorization: `Bearer ${token}` };

                // Parallel fetch for dashboard overview
                const [ordersRes, analyticsRes, notifsRes, favsRes] = await Promise.all([
                    fetch("/api/account/orders?limit=5", { headers }),
                    fetch("/api/account/analytics", { headers }),
                    fetch("/api/account/notifications?limit=3", { headers }),
                    fetch("/api/account/favorites", { headers }), // Need limit=3 applied later
                ]);

                if (ordersRes.ok) {
                    const d = await ordersRes.json();
                    setOrders(d.data?.orders ?? d.orders ?? []);
                }
                if (analyticsRes.ok) {
                    const d = await analyticsRes.json();
                    setAnalytics(d.data ?? d);
                }
                if (notifsRes.ok) {
                    const d = await notifsRes.json();
                    setNotifications(d.data ?? []);
                }
                if (favsRes.ok) {
                    const d = await favsRes.json();
                    setFavorites((d.data?.favorites ?? []).slice(0, 3));
                }
            } catch (err) {
                console.error("Account load error:", err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [user, getIdToken]);

    // Live SSE — update active order status in real time
    const { connected } = useCustomerSSE({
        customerId: user?.id ?? "",
        onStatusChange: (payload) => {
            setOrders((prev) =>
                prev.map((o) =>
                    o.id === payload.orderId ? { ...o, status: payload.newStatus as string } : o
                )
            );
        },
    });

    if (loading) {
        return (
            <div className="space-y-4 animate-pulse">
                <div className="h-28 rounded-2xl bg-neutral-200 dark:bg-neutral-700" />
                <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl bg-neutral-200 dark:bg-neutral-700" />)}
                </div>
            </div>
        );
    }

    // Active orders = PENDING or ACCEPTED
    const activeOrders = orders.filter(o => o.status === "PENDING" || o.status === "ACCEPTED");

    // Avatar initials
    const initials = user?.name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() ?? "U";
    const avatarColors = ["bg-primary-500", "bg-accent-500", "bg-green-500", "bg-purple-500", "bg-orange-500"];
    const color = avatarColors[(user?.name?.charCodeAt(0) ?? 0) % avatarColors.length];

    return (
        <div className="space-y-6">
            {/* Header card */}
            <div className="rounded-2xl border border-neutral-200/60 bg-white p-6 shadow-sm dark:bg-neutral-800 dark:border-neutral-700">
                <div className="flex items-center gap-4">
                    <div className={`h-14 w-14 rounded-full ${color} flex items-center justify-center text-white text-xl font-bold shrink-0`}>
                        {initials}
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-50">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">{user?.email}</p>
                    </div>
                    {/* Live dot */}
                    <div className="ml-auto flex items-center gap-1.5 text-xs">
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
                                <span className="h-2 w-2 rounded-full bg-gray-300 animate-pulse" />
                                <span className="text-gray-400">Connecting...</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats row */}
            {analytics && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard title="Total Spent" value={`Rs. ${analytics.totalSpent.toLocaleString()}`} icon="💳" />
                    <StatCard title="Total Orders" value={analytics.totalOrders} icon="🛍️" />
                    <StatCard title="Kitchens Tried" value={analytics.kitchensTried} icon="🍱" />
                    <StatCard title="Reviews Written" value={analytics.totalReviews} icon="⭐" />
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Left Column: Orders */}
                <div className="space-y-6">
                    {/* Active orders */}
                    <div className="rounded-2xl border border-neutral-200/60 bg-white p-6 shadow-sm dark:bg-neutral-800 dark:border-neutral-700">
                        <SectionHeader title="Active Orders" description="Orders currently being prepared" action={<span className="animate-pulse flex h-3 w-3 rounded-full bg-green-500" />} />
                        {activeOrders.length > 0 ? (
                            <div className="space-y-3">
                                {activeOrders.map((order) => (
                                    <div key={order.id} className="flex items-center justify-between rounded-xl bg-neutral-50 p-4 dark:bg-neutral-700/50">
                                        <div>
                                            <p className="font-medium text-sm text-neutral-900 dark:text-neutral-100">
                                                {order.kitchen?.name ?? "Kitchen"}
                                            </p>
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                                                Rs. {Number(order.totalAmount).toLocaleString()} · {order.items?.length ?? 0} item(s)
                                            </p>
                                            <span className={`inline-block mt-2 rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadge(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </div>
                                        <Link href={`/account/orders/${order.id}`} className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 shadow-sm border border-neutral-200 hover:bg-neutral-50 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-600 dark:hover:bg-neutral-700">
                                            Track →
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6 bg-neutral-50 rounded-xl dark:bg-neutral-800/50">
                                <p className="text-sm text-neutral-500 dark:text-neutral-400">No active orders right now</p>
                                <Link href="/explore" className="mt-2 inline-block text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400">
                                    Browse cuisines →
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Recent orders */}
                    <div className="rounded-2xl border border-neutral-200/60 bg-white p-6 shadow-sm dark:bg-neutral-800 dark:border-neutral-700">
                        <SectionHeader title="Recent Orders" action={<Link href="/account/orders" className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400">View all</Link>} />
                        {orders.length > 0 ? (
                            <div className="divide-y divide-neutral-100 dark:divide-neutral-700/50">
                                {orders.slice(0, 3).map((order) => (
                                    <div key={order.id} className="py-3 flex items-center justify-between hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 rounded-xl px-2 -mx-2 transition-colors">
                                        <div>
                                            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{order.kitchen?.name ?? "Kitchen"}</p>
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                                {new Date(order.createdAt).toLocaleDateString("en-PK", { month: "short", day: "numeric" })} · {order.status}
                                            </p>
                                        </div>
                                        <Link href={`/account/orders/${order.id}`} className="text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 p-2">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-neutral-500 text-center py-4 dark:text-neutral-400">No past orders found.</p>
                        )}
                    </div>
                </div>

                {/* Right Column: Notifications & Favorites */}
                <div className="space-y-6">
                    {/* Notifications */}
                    <div className="rounded-2xl border border-neutral-200/60 bg-white p-6 shadow-sm dark:bg-neutral-800 dark:border-neutral-700">
                        <SectionHeader title="Recent Notifications" action={<Link href="/account/notifications" className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400">View all</Link>} />
                        {notifications.length > 0 ? (
                            <div className="space-y-3">
                                {notifications.map((n) => (
                                    <div key={n.id} className={`p-3 rounded-xl border ${n.isRead ? "border-transparent bg-neutral-50" : "border-primary-100 bg-primary-50/30"} dark:${n.isRead ? "bg-neutral-700/30 border-transparent" : "bg-primary-900/10 border-primary-900/30"}`}>
                                        <p className={`text-sm ${!n.isRead ? "font-semibold text-neutral-900 dark:text-white" : "font-medium text-neutral-700 dark:text-neutral-300"}`}>{n.title}</p>
                                        <p className="text-xs text-neutral-500 mt-1 line-clamp-2">{n.body}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-neutral-500 text-center py-4 dark:text-neutral-400">No unread notifications.</p>
                        )}
                    </div>

                    {/* Favorites */}
                    <div className="rounded-2xl border border-neutral-200/60 bg-white p-6 shadow-sm dark:bg-neutral-800 dark:border-neutral-700">
                        <SectionHeader title="Favorite Kitchens" action={<Link href="/account/favorites" className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400">View all</Link>} />
                        {favorites.length > 0 ? (
                            <div className="space-y-3">
                                {favorites.map((fav) => (
                                    <div key={fav.favoriteId} className="flex items-center gap-3 p-2 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-700/50">
                                        <div className="w-12 h-12 rounded-lg bg-neutral-200 shrink-0 overflow-hidden flex items-center justify-center text-xl dark:bg-neutral-700">
                                            {fav.kitchen.name[0]}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-neutral-900 truncate dark:text-white">{fav.kitchen.name}</p>
                                            <p className="text-xs text-neutral-500 flex items-center gap-1 dark:text-neutral-400">
                                                <span className="text-yellow-400">★</span> {fav.kitchen.avgRating} · {fav.kitchen.city}
                                            </p>
                                        </div>
                                        <Link href={`/${fav.kitchen.name.toLowerCase().replace(/\s+/g, '-')}`} className="shrink-0 p-2 text-primary-600 dark:text-primary-400">
                                            Order
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6 bg-neutral-50 rounded-xl dark:bg-neutral-800/50">
                                <p className="text-sm text-neutral-500 dark:text-neutral-400">No favorites yet</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}