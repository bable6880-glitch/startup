"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

type OrderItem = {
    id: string;
    mealId: string;
    quantity: number;
    priceAtOrder: number;
    notes: string | null;
    meal: {
        name: string;
    };
};

type OrderCustomer = {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
};

type Order = {
    id: string;
    status: "PENDING" | "ACCEPTED" | "COMPLETED" | "CANCELLED";
    totalAmount: number;
    currency: string;
    notes: string | null;
    deliveryMode: "SELF_PICKUP" | "FREE_DELIVERY";
    estimatedMinutes: number | null;
    createdAt: string;
    items: OrderItem[];
    customer: OrderCustomer;
    customerName: string | null;
    customerPhone: string | null;
    deliveryAddress: string | null;
};

interface OrderCardProps {
    order: Order;
    getToken: () => Promise<string | null>;
    onStatusChange?: (orderId: string, newStatus: string) => void;
}

export function OrderCard({ order, getToken, onStatusChange }: OrderCardProps) {
    const router = useRouter();
    const [updating, setUpdating] = useState(false);
    const [localStatus, setLocalStatus] = useState(order.status);
    const [estimatedTime, setEstimatedTime] = useState(order.estimatedMinutes || 30);

    const updateStatus = async (status: string) => {
        setUpdating(true);
        try {
            const token = await getToken();
            const res = await fetch(`/api/orders/${order.id}/status`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    status,
                    estimatedMinutes: status === "ACCEPTED" ? estimatedTime : undefined,
                }),
            });

            if (!res.ok) throw new Error("Failed to update status");

            // Optimistic local update — card will visually transition
            setLocalStatus(status as Order["status"]);

            // Notify parent to move card between tabs without full page refresh
            if (onStatusChange) {
                onStatusChange(order.id, status);
            }
        } catch (error) {
            alert("Failed to update order status");
            console.error(error);
        } finally {
            setUpdating(false);
        }
    };

    const statusColors = {
        PENDING: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
        ACCEPTED: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
        COMPLETED: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
        CANCELLED: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
    };

    return (
        <div className={`rounded-xl border border-neutral-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:bg-neutral-800 dark:border-neutral-700 ${updating ? 'opacity-60 pointer-events-none' : ''}`}>
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-lg text-neutral-900 dark:text-neutral-100">
                            Order #{order.id.slice(0, 8)}
                        </span>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold border ${statusColors[localStatus]}`}>
                            {localStatus}
                        </span>
                    </div>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        {format(new Date(order.createdAt), "MMM d, h:mm a")} • {order.deliveryMode.replace("_", " ")}
                    </p>
                    <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mt-1">
                        Customer: {order.customerName || order.customer?.name || "Guest"}
                    </p>
                    {order.customerPhone && (
                        <div className="flex items-center gap-2 mt-1">
                            <a 
                                href={`tel:${order.customerPhone}`}
                                className="text-xs font-semibold text-primary-600 hover:underline dark:text-primary-400 flex items-center gap-1"
                            >
                                📞 {order.customerPhone}
                            </a>
                            <a 
                                href={`https://wa.me/${order.customerPhone.replace(/[^0-9]/g, "").replace(/^0/, "92")}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] font-bold text-white bg-[#25D366] px-1.5 py-0.5 rounded shadow-sm hover:bg-[#1fb855] transition-colors"
                            >
                                WA
                            </a>
                        </div>
                    )}
                    {order.deliveryAddress && (
                        <p className="text-xs text-neutral-500 mt-1.5 max-w-sm leading-relaxed dark:text-neutral-400 bg-neutral-50 p-2 rounded-lg border border-neutral-100 dark:bg-neutral-900/50 dark:border-neutral-700/50">
                            <span className="font-semibold block text-[10px] uppercase tracking-wider text-neutral-400 mb-0.5 dark:text-neutral-500">Delivery Address</span>
                            {order.deliveryAddress}
                        </p>
                    )}
                </div>
                <div className="text-right">
                    <p className="text-xl font-bold text-primary-600 dark:text-primary-400">
                        Rs. {order.totalAmount}
                    </p>
                    <p className="text-xs text-neutral-400 mt-1">{order.items.length} items</p>
                </div>
            </div>

            {/* Items */}
            <div className="border-t border-neutral-100 py-3 space-y-2 dark:border-neutral-700">
                {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                        <div className="flex gap-2">
                            <span className="font-bold text-neutral-600 dark:text-neutral-400">{item.quantity}x</span>
                            <span className="text-neutral-800 dark:text-neutral-200">{item.meal.name}</span>
                        </div>
                        <span className="text-neutral-500 dark:text-neutral-400">
                            Rs. {item.priceAtOrder * item.quantity}
                        </span>
                    </div>
                ))}
            </div>

            {/* Notes */}
            {order.notes && (
                <div className="mb-4 rounded-lg bg-yellow-50 p-2 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
                    📝 Note: {order.notes}
                </div>
            )}

            {/* Actions */}
            <div className="mt-4 flex flex-wrap gap-2 pt-4 border-t border-neutral-100 dark:border-neutral-700">
                {localStatus === "PENDING" && (
                    <>
                        <div className="flex items-center gap-2 mr-auto">
                            <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Est. Time:</label>
                            <select
                                value={estimatedTime}
                                onChange={(e) => setEstimatedTime(Number(e.target.value))}
                                className="rounded-lg border border-neutral-200 py-1 px-2 text-sm bg-white dark:bg-neutral-800 dark:border-neutral-700"
                            >
                                <option value={15}>15 min</option>
                                <option value={30}>30 min</option>
                                <option value={45}>45 min</option>
                                <option value={60}>60 min</option>
                            </select>
                        </div>
                        <button
                            onClick={() => updateStatus("ACCEPTED")}
                            disabled={updating}
                            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                            {updating ? "Accepting..." : "Accept"}
                        </button>
                        <button
                            onClick={() => updateStatus("CANCELLED")}
                            disabled={updating}
                            className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-50 dark:bg-neutral-800 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
                        >
                            Decline
                        </button>
                    </>
                )}

                {localStatus === "ACCEPTED" && (
                    <>
                        <button
                            onClick={() => updateStatus("COMPLETED")}
                            disabled={updating}
                            className="flex-1 rounded-lg bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700 disabled:opacity-50 transition-colors"
                        >
                            {updating ? "Completing..." : "Mark Completed ✓"}
                        </button>
                        <button
                            onClick={() => router.push(`/orders/${order.id}`)}
                            className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-bold text-neutral-700 hover:bg-neutral-50 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-700 transition-colors"
                        >
                            View Map 🗺️
                        </button>
                    </>
                )}

                {["COMPLETED", "CANCELLED", "PENDING"].includes(localStatus) && (
                    <button
                        onClick={() => router.push(`/orders/${order.id}`)}
                        className="w-full rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-bold text-neutral-700 hover:bg-neutral-50 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-700 transition-colors"
                    >
                        View Order Details
                    </button>
                )}
            </div>
        </div>
    );
}
