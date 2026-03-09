"use client";

import { useAuth } from "@/lib/firebase/auth-context";
import { useEffect, useState } from "react";
import Link from "next/link";

type Order = {
    id: string;
    status: string;
    totalAmount: number;
    createdAt: string;
    kitchen?: { name: string; city: string };
    items?: Array<{ meal?: { name: string }; quantity: number }>;
};

function statusBadge(status: string) {
    const map: Record<string, string> = {
        PENDING: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
        ACCEPTED: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
        COMPLETED: "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300",
        CANCELLED: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    };
    return map[status] ?? "bg-neutral-100 text-neutral-600";
}

const FILTERS = ["All", "Active", "Completed", "Cancelled"] as const;
type Filter = typeof FILTERS[number];

export default function OrdersPage() {
    const { user, getIdToken } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<Filter>("All");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        if (!user) return;
        const load = async () => {
            setLoading(true);
            try {
                const token = await getIdToken();
                const res = await fetch(`/api/account/orders?page=${page}&limit=10`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const d = await res.json();
                    setOrders(d.data?.orders ?? d.orders ?? []);
                    setTotalPages(d.data?.pagination?.totalPages ?? d.pagination?.totalPages ?? 1);
                }
            } catch (err) {
                console.error("Orders load error:", err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [user, getIdToken, page]);

    const filtered = orders.filter((o) => {
        if (filter === "All") return true;
        if (filter === "Active") return o.status === "PENDING" || o.status === "ACCEPTED";
        if (filter === "Completed") return o.status === "COMPLETED";
        if (filter === "Cancelled") return o.status === "CANCELLED";
        return true;
    });

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">My Orders</h1>

            {/* Filter tabs */}
            <div className="flex gap-2 flex-wrap">
                {FILTERS.map((f) => (
                    <button
                        key={f}
                        onClick={() => { setFilter(f); setPage(1); }}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === f
                                ? "bg-primary-500 text-white"
                                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300"
                            }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* Orders list */}
            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="h-20 rounded-xl bg-neutral-200 animate-pulse dark:bg-neutral-700" />
                    ))}
                </div>
            ) : filtered.length > 0 ? (
                <div className="space-y-3">
                    {filtered.map((order) => {
                        const itemSummary = order.items
                            ?.slice(0, 2)
                            .map(i => `${i.quantity}× ${i.meal?.name ?? "Item"}`)
                            .join(", ") + (order.items && order.items.length > 2 ? ` +${order.items.length - 2} more` : "");

                        return (
                            <Link
                                key={order.id}
                                href={`/account/orders/${order.id}`}
                                className="flex items-center justify-between rounded-xl border border-neutral-200/60 bg-white p-4 shadow-sm hover:shadow-md transition-all dark:bg-neutral-800 dark:border-neutral-700"
                            >
                                <div className="min-w-0">
                                    <p className="font-medium text-neutral-900 dark:text-neutral-100">
                                        {order.kitchen?.name ?? "Kitchen"}
                                        <span className="ml-2 text-xs text-neutral-400">{order.kitchen?.city}</span>
                                    </p>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                                        {itemSummary || `Order #${order.id.slice(0, 8)}`}
                                    </p>
                                    <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
                                        {new Date(order.createdAt).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 shrink-0 ml-3">
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Rs. {Number(order.totalAmount).toLocaleString()}</p>
                                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadge(order.status)}`}>{order.status}</span>
                                    </div>
                                    <span className="text-neutral-300 dark:text-neutral-600">→</span>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-12 rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-700">
                    <span className="text-4xl block mb-3">📦</span>
                    <p className="text-neutral-500 dark:text-neutral-400">No {filter !== "All" ? filter.toLowerCase() : ""} orders yet</p>
                    <Link href="/explore" className="mt-2 inline-block text-sm text-primary-600 hover:underline dark:text-primary-400">Browse kitchens →</Link>
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-4 py-2 rounded-lg text-sm border border-neutral-200 disabled:opacity-40 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                    >
                        ← Previous
                    </button>
                    <span className="text-sm text-neutral-500 dark:text-neutral-400">Page {page} of {totalPages}</span>
                    <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-4 py-2 rounded-lg text-sm border border-neutral-200 disabled:opacity-40 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                    >
                        Next →
                    </button>
                </div>
            )}
        </div>
    );
}