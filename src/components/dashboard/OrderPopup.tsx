"use client";

import { useEffect } from "react";

export interface OrderPopupData {
    id: string;
    customerName: string;
    itemCount: number;
    totalAmount: number;
    kitchenName: string;
}

interface OrderPopupProps {
    order: OrderPopupData;
    onView: () => void;
    onDismiss: () => void;
}

export function OrderPopup({ order, onView, onDismiss }: OrderPopupProps) {
    useEffect(() => {
        const timer = setTimeout(onDismiss, 30000);
        return () => clearTimeout(timer);
    }, [onDismiss]);

    return (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9999] w-[calc(100vw-2rem)] sm:w-80 bg-white rounded-2xl shadow-2xl border border-orange-100 animate-slide-up overflow-hidden">
            {/* Orange accent top bar */}
            <div className="h-1 bg-gradient-to-r from-orange-400 to-orange-500" />

            {/* Content */}
            <div className="p-4">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0 text-xl">
                        🛍️
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900">New Order Received!</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {order.customerName} ordered {order.itemCount} item{order.itemCount > 1 ? "s" : ""}
                        </p>
                        <p className="text-sm font-medium text-orange-600 mt-1">
                            PKR {order.totalAmount.toLocaleString()}
                        </p>
                    </div>
                    <button
                        onClick={onDismiss}
                        className="text-gray-300 hover:text-gray-500 transition-colors p-1 flex-shrink-0"
                    >
                        ✕
                    </button>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 mt-3">
                    <button
                        onClick={onView}
                        className="flex-1 py-2 bg-orange-500 text-white text-xs font-medium rounded-xl hover:bg-orange-600 transition-colors"
                    >
                        View Order →
                    </button>
                    <button
                        onClick={onDismiss}
                        className="px-3 py-2 border border-gray-200 text-gray-500 text-xs rounded-xl hover:bg-gray-50 transition-colors"
                    >
                        Later
                    </button>
                </div>
            </div>

            {/* Auto-dismiss progress bar */}
            <div className="h-0.5 bg-gray-100">
                <div
                    className="h-full bg-orange-300 animate-shrink-width"
                    style={{ animationDuration: "30s" }}
                />
            </div>
        </div>
    );
}
