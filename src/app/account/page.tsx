"use client";

import { useAuth } from "@/lib/firebase/auth-context";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useCustomerSSE } from "@/hooks/use-customer-sse";

type Order = {
    id: string;
    status: string;
    totalAmount: number;
    createdAt: string;
    kitchen?: { name: string; city: string };
    items?: Array<{ meal?: { name: string }; quantity: number }>;
};

type Profile = {
    totalOrders: number;
    totalReviews: number;
    kitchensTried: number;
    createdAt: string;
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
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const load = async () => {
            try {
                const token = await getIdToken();
                const headers = { Authorization: `Bearer ${token}` };

                const [profileRes, ordersRes] = await Promise.all([
                    fetch("/api/account/profile", { headers }),
                    fetch("/api/account/orders?limit=5", { headers }),
                ]);

                if (profileRes.ok) {
                    const d = await profileRes.json();
                    setProfile(d.data ?? d);
                }
                if (ordersRes.ok) {
                    const d = await ordersRes.json();
                    setOrders(d.data?.orders ?? d.orders ?? []);
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
    const memberSince = profile?.createdAt
        ? new Date(profile.createdAt).toLocaleDateString("en-PK", { month: "long", year: "numeric" })
        : "";

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
                        <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-50">{user?.name}</h1>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">{user?.email}</p>
                        {memberSince && <p className="text-xs text-neutral-400 mt-0.5 dark:text-neutral-500">Member since {memberSince}</p>}
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
            {profile && (
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: "Total Orders", value: profile.totalOrders, icon: "📦" },
                        { label: "Reviews Written", value: profile.totalReviews, icon: "⭐" },
                        { label: "Kitchens Tried", value: profile.kitchensTried, icon: "🍱" },
                    ].map((s) => (
                        <div key={s.label} className="rounded-xl border border-neutral-200/60 bg-white p-4 shadow-sm text-center dark:bg-neutral-800 dark:border-neutral-700">
                            <span className="text-xl">{s.icon}</span>
                            <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-50 mt-1">{s.value}</p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400">{s.label}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Active orders */}
            <div className="rounded-2xl border border-neutral-200/60 bg-white p-6 shadow-sm dark:bg-neutral-800 dark:border-neutral-700">
                <h2 className="font-bold text-neutral-900 dark:text-neutral-50 mb-4">🔄 Active Orders</h2>
                {activeOrders.length > 0 ? (
                    <div className="space-y-3">
                        {activeOrders.map((order) => (
                            <div key={order.id} className="flex items-center justify-between rounded-xl bg-neutral-50 p-3 dark:bg-neutral-700/50">
                                <div>
                                    <p className="font-medium text-sm text-neutral-900 dark:text-neutral-100">
                                        {order.kitchen?.name ?? "Kitchen"}
                                    </p>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                        Rs. {Number(order.totalAmount).toLocaleString()} · {order.items?.length ?? 0} item(s)
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge(order.status)}`}>
                                        {order.status}
                                    </span>
                                    <Link href={`/account/orders/${order.id}`} className="text-xs text-primary-600 hover:underline dark:text-primary-400">
                                        Track →
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-6">
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">No active orders right now</p>
                        <Link href="/explore" className="mt-2 inline-block text-sm text-primary-600 hover:underline dark:text-primary-400">
                            Browse kitchens →
                        </Link>
                    </div>
                )}
            </div>

            {/* Recent orders */}
            <div className="rounded-2xl border border-neutral-200/60 bg-white p-6 shadow-sm dark:bg-neutral-800 dark:border-neutral-700">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-neutral-900 dark:text-neutral-50">📋 Recent Orders</h2>
                    <Link href="/account/orders" className="text-sm text-primary-600 hover:underline dark:text-primary-400">View all →</Link>
                </div>
                {orders.length > 0 ? (
                    <div className="space-y-2">
                        {orders.slice(0, 5).map((order) => (
                            <div key={order.id} className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0 dark:border-neutral-700">
                                <div>
                                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{order.kitchen?.name ?? "Kitchen"}</p>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                        {new Date(order.createdAt).toLocaleDateString("en-PK")} · Rs. {Number(order.totalAmount).toLocaleString()}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadge(order.status)}`}>{order.status}</span>
                                    <Link href={`/account/orders/${order.id}`} className="text-xs text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400">→</Link>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-neutral-500 text-center py-4 dark:text-neutral-400">No orders yet</p>
                )}
            </div>
        </div>
    );
}