"use client";

import { useAuth } from "@/lib/firebase/auth-context";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type OrderDetail = {
    id: string;
    status: string;
    totalAmount: number;
    deliveryMode: string;
    notes: string | null;
    createdAt: string;
    acceptedAt: string | null;
    completedAt: string | null;
    cancelledAt: string | null;
    kitchen: {
        id: string;
        name: string;
        city: string;
        address: string;
        phoneNumber: string;
    };
    items: Array<{
        quantity: number;
        price: number;
        meal: { name: string; imageUrl: string | null };
    }>;
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

export default function OrderDetailPage() {
    const { id } = useParams<{ id: string }>();
    const { user, getIdToken } = useAuth();
    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user || !id) return;
        const load = async () => {
            try {
                const token = await getIdToken();
                const res = await fetch(`/api/account/orders/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) {
                    setError(res.status === 404 ? "Order not found" : "Failed to load order");
                    return;
                }
                const d = await res.json();
                setOrder(d.data ?? d);
            } catch {
                setError("Something went wrong");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [user, id, getIdToken]);

    if (loading) {
        return (
            <div className="space-y-4 animate-pulse">
                <div className="h-8 w-48 rounded-lg bg-neutral-200 dark:bg-neutral-700" />
                <div className="h-40 rounded-2xl bg-neutral-200 dark:bg-neutral-700" />
                <div className="h-32 rounded-2xl bg-neutral-200 dark:bg-neutral-700" />
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="text-center py-20">
                <span className="text-5xl block mb-4">😕</span>
                <h2 className="text-xl font-semibold text-neutral-700 dark:text-neutral-300">{error || "Order not found"}</h2>
                <Link href="/account" className="mt-4 inline-block text-primary-600 hover:underline dark:text-primary-400">
                    ← Back to Account
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <Link href="/account" className="text-sm text-neutral-500 hover:text-primary-600 dark:text-neutral-400 dark:hover:text-primary-400">
                        ← Back to Account
                    </Link>
                    <h1 className="mt-2 text-xl font-bold text-neutral-900 dark:text-neutral-50">
                        Order Details
                    </h1>
                </div>
                <span className={`rounded-full px-3 py-1.5 text-sm font-semibold ${statusBadge(order.status)}`}>
                    {order.status}
                </span>
            </div>

            {/* Kitchen Info */}
            <div className="rounded-2xl border border-neutral-200/60 bg-white p-5 shadow-sm dark:bg-neutral-800 dark:border-neutral-700">
                <h2 className="font-bold text-neutral-900 dark:text-neutral-50 mb-2">
                    {order.kitchen.name}
                </h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                    {[order.kitchen.address, order.kitchen.city].filter(Boolean).join(", ")}
                </p>
                {order.kitchen.phoneNumber && (
                    <p className="text-sm text-neutral-500 mt-1 dark:text-neutral-400">
                        📞 {order.kitchen.phoneNumber}
                    </p>
                )}
            </div>

            {/* Items */}
            <div className="rounded-2xl border border-neutral-200/60 bg-white p-5 shadow-sm dark:bg-neutral-800 dark:border-neutral-700">
                <h2 className="font-bold text-neutral-900 dark:text-neutral-50 mb-4">🛒 Items</h2>
                <div className="space-y-3">
                    {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0 dark:border-neutral-700">
                            <div className="flex items-center gap-3">
                                {item.meal.imageUrl && (
                                    <div className="h-10 w-10 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-700 flex-shrink-0">
                                        <img src={item.meal.imageUrl} alt={item.meal.name} className="h-full w-full object-cover" loading="lazy" />
                                    </div>
                                )}
                                <div>
                                    <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{item.meal.name}</p>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">× {item.quantity}</p>
                                </div>
                            </div>
                            <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                                Rs. {(item.price * item.quantity).toLocaleString()}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="mt-4 pt-3 border-t border-neutral-200 dark:border-neutral-700 flex justify-between">
                    <span className="font-bold text-neutral-900 dark:text-neutral-50">Total</span>
                    <span className="font-bold text-primary-600 dark:text-primary-400">
                        Rs. {Number(order.totalAmount).toLocaleString()}
                    </span>
                </div>
            </div>

            {/* Order Meta */}
            <div className="rounded-2xl border border-neutral-200/60 bg-white p-5 shadow-sm dark:bg-neutral-800 dark:border-neutral-700">
                <h2 className="font-bold text-neutral-900 dark:text-neutral-50 mb-3">📋 Details</h2>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                    <dt className="text-neutral-500 dark:text-neutral-400">Delivery Mode</dt>
                    <dd className="text-neutral-900 dark:text-neutral-100 font-medium">
                        {order.deliveryMode === "SELF_PICKUP" ? "🏃 Self Pickup" : "🛵 Free Delivery"}
                    </dd>

                    <dt className="text-neutral-500 dark:text-neutral-400">Placed</dt>
                    <dd className="text-neutral-900 dark:text-neutral-100 font-medium">
                        {new Date(order.createdAt).toLocaleString("en-PK")}
                    </dd>

                    {order.acceptedAt && (
                        <>
                            <dt className="text-neutral-500 dark:text-neutral-400">Accepted</dt>
                            <dd className="text-neutral-900 dark:text-neutral-100 font-medium">
                                {new Date(order.acceptedAt).toLocaleString("en-PK")}
                            </dd>
                        </>
                    )}
                    {order.completedAt && (
                        <>
                            <dt className="text-neutral-500 dark:text-neutral-400">Completed</dt>
                            <dd className="text-neutral-900 dark:text-neutral-100 font-medium">
                                {new Date(order.completedAt).toLocaleString("en-PK")}
                            </dd>
                        </>
                    )}
                    {order.cancelledAt && (
                        <>
                            <dt className="text-neutral-500 dark:text-neutral-400">Cancelled</dt>
                            <dd className="text-neutral-900 dark:text-neutral-100 font-medium">
                                {new Date(order.cancelledAt).toLocaleString("en-PK")}
                            </dd>
                        </>
                    )}
                </dl>

                {order.notes && (
                    <div className="mt-4 pt-3 border-t border-neutral-200 dark:border-neutral-700">
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-1">Notes</p>
                        <p className="text-sm text-neutral-700 dark:text-neutral-300">{order.notes}</p>
                    </div>
                )}
            </div>
        </div>
    );
}