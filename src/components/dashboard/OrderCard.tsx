"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";
import { formatDistanceToNow, format } from "date-fns";
import { OrderStatusBadge, type OrderStatus } from "@/components/orders/OrderStatusBadge";
import { CookOrderDetailModal } from "@/components/orders/CookOrderDetailModal";
import { cn } from "@/lib/utils";

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
    status: OrderStatus;
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
    const [isModalOpen, setIsModalOpen] = useState(false);

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

            setLocalStatus(status as OrderStatus);

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

    const statusAccentColors: Record<OrderStatus, string> = {
        PENDING: "border-l-amber-500",
        ACCEPTED: "border-l-blue-500",
        COMPLETED: "border-l-green-500",
        CANCELLED: "border-l-red-500",
    };

    const customerName = order.customerName || order.customer?.name || "Guest";
    const initials = customerName.substring(0, 2).toUpperCase();

    return (
        <div className={cn(
            "relative rounded-xl bg-white dark:bg-neutral-900 border-y border-r border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 animate-fade-in-up border-l-[3px]",
            statusAccentColors[localStatus] || "border-l-neutral-500",
            updating && "opacity-60 pointer-events-none"
        )}>
            <div className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-xs font-bold text-neutral-600 dark:text-neutral-400">
                            {initials}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-lg text-neutral-900 dark:text-neutral-100">
                                    {customerName}
                                </span>
                                <OrderStatusBadge status={localStatus} />
                            </div>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                                #{order.id.slice(0, 8)} • {formatDistanceToNow(new Date(order.createdAt))} ago • {order.deliveryMode.replace("_", " ")}
                            </p>
                            {order.customerPhone && (
                                <div className="flex items-center gap-2 mt-1.5">
                                    <a 
                                        href={`tel:${order.customerPhone}`}
                                        className="text-xs font-semibold text-primary-600 hover:underline dark:text-primary-400 flex items-center gap-1"
                                    >
                                        📞 {order.customerPhone}
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xl font-bold text-neutral-900 dark:text-white">
                            Rs. {order.totalAmount}
                        </p>
                        <p className="text-xs text-neutral-400 mt-1 font-medium">{order.items.length} items</p>
                    </div>
                </div>

                {/* Items */}
                <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-3 space-y-2 mb-4">
                    {order.items.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                            <div className="flex gap-2">
                                <span className="font-bold text-neutral-600 dark:text-neutral-400">{item.quantity}x</span>
                                <span className="text-neutral-800 dark:text-neutral-200 font-medium">{item.meal.name}</span>
                            </div>
                            <span className="text-neutral-500 dark:text-neutral-400 font-medium">
                                Rs. {item.priceAtOrder * item.quantity}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Delivery Address */}
                {order.deliveryAddress && (
                    <div className="mb-4">
                        <p className="text-xs text-neutral-600 dark:text-neutral-400 max-w-sm leading-relaxed flex items-start gap-1.5">
                            <span className="text-base mt-[-2px]">📍</span> 
                            {order.deliveryAddress}
                        </p>
                    </div>
                )}

                {/* Notes */}
                {order.notes && (
                    <div className="mb-4 rounded-lg bg-orange-50/50 p-2.5 text-sm text-orange-800 dark:bg-orange-500/10 dark:text-orange-300 border border-orange-100 dark:border-orange-500/20">
                        <span className="font-semibold text-xs uppercase tracking-wider block mb-0.5">Kitchen Note</span>
                        {order.notes}
                    </div>
                )}

                {/* Actions */}
                <div className="mt-4 flex flex-wrap gap-2 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                    {localStatus === "PENDING" && (
                        <>
                            <div className="flex items-center gap-2 mr-auto">
                                <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Est. Time:</label>
                                <select
                                    value={estimatedTime}
                                    onChange={(e) => setEstimatedTime(Number(e.target.value))}
                                    className="h-11 rounded-xl border border-neutral-200 px-3 text-sm font-medium bg-white dark:bg-neutral-800 dark:border-neutral-700 dark:text-white"
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
                                className="min-h-[44px] rounded-xl bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
                            >
                                {updating ? "Accepting..." : <><span className="text-base">✓</span> Accept</>}
                            </button>
                            <button
                                onClick={() => updateStatus("CANCELLED")}
                                disabled={updating}
                                className="min-h-[44px] rounded-xl border border-neutral-200 bg-white px-5 text-sm font-bold text-neutral-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50 disabled:opacity-50 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-700 transition-colors"
                            >
                                Reject
                            </button>
                        </>
                    )}

                    {localStatus === "ACCEPTED" && (
                        <>
                            <button
                                onClick={() => updateStatus("COMPLETED")}
                                disabled={updating}
                                className="min-h-[44px] flex-1 rounded-xl bg-green-600 px-4 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                            >
                                {updating ? "Completing..." : "Mark as Completed"}
                            </button>
                            <button
                                onClick={() => router.push(`/orders/${order.id}`)}
                                className="min-h-[44px] rounded-xl border border-neutral-200 bg-white px-5 text-sm font-bold text-neutral-700 hover:bg-neutral-50 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-700 transition-colors"
                            >
                                View Map
                            </button>
                        </>
                    )}

                    {["COMPLETED", "CANCELLED"].includes(localStatus) && (
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="min-h-[44px] w-full rounded-xl border border-neutral-200 bg-white px-4 text-sm font-bold text-neutral-700 hover:bg-neutral-50 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-700 transition-colors"
                        >
                            View Order Details
                        </button>
                    )}
                </div>
            </div>

            {isModalOpen && (
                <CookOrderDetailModal order={order} onClose={() => setIsModalOpen(false)} />
            )}
        </div>
    );
}
