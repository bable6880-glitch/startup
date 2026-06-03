"use client";

import { useState } from "react";
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
    status: string;
    totalAmount: number;
    currency: string;
    notes: string | null;
    deliveryMode: "SELF_PICKUP" | "FREE_DELIVERY";
    createdAt: string;
    items: OrderItem[];
    customer: OrderCustomer;
    customerName: string | null;
    customerPhone: string | null;
    deliveryAddress: string | null;
};

interface CookOrderDetailModalProps {
    order: Order;
    onClose: () => void;
}

export function CookOrderDetailModal({ order, onClose }: CookOrderDetailModalProps) {
    // Determine timeline steps based on available data and simplified schema
    const steps = [
        { label: "Placed", time: order.createdAt, done: true },
        { label: "Accepted", time: null, done: ["ACCEPTED", "COMPLETED"].includes(order.status) },
        { label: "Completed", time: null, done: order.status === "COMPLETED" },
    ];

    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 animate-fade-in-up">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            
            <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl flex flex-col">
                <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-neutral-100 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md">
                    <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Order Details</h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 transition-colors">
                        ✕
                    </button>
                </div>
                
                <div className="p-5 space-y-6">
                    {/* Customer Info */}
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold text-xl">
                            {(order.customerName || order.customer?.name || "G").charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <p className="font-bold text-neutral-900 dark:text-white text-lg">
                                {order.customerName || order.customer?.name || "Guest"}
                            </p>
                            {order.customerPhone && (
                                <a href={`tel:${order.customerPhone}`} className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1.5 mt-0.5">
                                    📞 {order.customerPhone}
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Timeline */}
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">Order Timeline</h3>
                        <div className="space-y-4">
                            {steps.map((step, idx) => (
                                <div key={idx} className="flex items-start gap-3">
                                    <div className="relative flex flex-col items-center">
                                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${step.done ? "border-green-500 bg-green-500" : "border-neutral-300 dark:border-neutral-700"}`}>
                                            {step.done && <span className="text-[10px] text-white">✓</span>}
                                        </div>
                                        {idx < steps.length - 1 && (
                                            <div className={`w-0.5 h-6 mt-1 ${steps[idx + 1].done ? "bg-green-500" : "bg-neutral-200 dark:bg-neutral-800"}`} />
                                        )}
                                    </div>
                                    <div className="-mt-1">
                                        <p className={`text-sm font-medium ${step.done ? "text-neutral-900 dark:text-white" : "text-neutral-400"}`}>{step.label}</p>
                                        {step.time && <p className="text-xs text-neutral-500">{format(new Date(step.time), "h:mm a")}</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Order Items */}
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">Order Items</h3>
                        <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 space-y-3">
                            {order.items.map(item => (
                                <div key={item.id} className="flex justify-between text-sm">
                                    <div className="flex gap-3">
                                        <span className="font-bold text-neutral-500">{item.quantity}x</span>
                                        <span className="font-medium text-neutral-900 dark:text-neutral-200">{item.meal.name}</span>
                                    </div>
                                    <span className="font-medium text-neutral-600 dark:text-neutral-400">Rs. {item.priceAtOrder * item.quantity}</span>
                                </div>
                            ))}
                            <div className="pt-3 border-t border-neutral-200 dark:border-neutral-700 flex justify-between items-center">
                                <span className="font-bold text-neutral-900 dark:text-white">Total</span>
                                <span className="font-bold text-lg text-primary-600 dark:text-primary-400">Rs. {order.totalAmount}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs text-neutral-500 mt-1">
                                <span>Payment Method</span>
                                <span className="font-medium">Cash on Delivery</span>
                            </div>
                        </div>
                    </div>

                    {/* Map / Location placeholder */}
                    {order.deliveryAddress && (
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">Delivery Location</h3>
                            <div className="h-32 bg-neutral-100 dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 flex flex-col items-center justify-center gap-2 text-neutral-500 p-4 text-center">
                                <span className="text-2xl">📍</span>
                                <p className="text-sm font-medium">{order.deliveryAddress}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
