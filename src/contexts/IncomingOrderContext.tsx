"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { useKitchenSSE } from "@/hooks/use-kitchen-sse";
import { IncomingOrderToast } from "@/components/orders/IncomingOrderToast";
import { getErrorMessage } from "@/lib/utils/error-handler";
import type { OrderStatus } from "@/components/orders/OrderStatusBadge";

export interface PendingOrder {
    id: string;
    customerName: string;
    itemCount: number;
    totalAmount: number;
    createdAt: string;
}

interface IncomingOrderContextValue {
    pendingOrders: PendingOrder[];
    acceptOrder: (orderId: string) => Promise<void>;
    rejectOrder: (orderId: string, reason?: string) => Promise<void>;
    dismissOrder: (orderId: string) => void;
}

const IncomingOrderContext = createContext<IncomingOrderContextValue | undefined>(undefined);

export function useIncomingOrders() {
    const ctx = useContext(IncomingOrderContext);
    if (!ctx) throw new Error("useIncomingOrders must be used within IncomingOrderProvider");
    return ctx;
}

export function IncomingOrderProvider({ children, kitchenId }: { children: ReactNode; kitchenId: string | null }) {
    const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);

    const handleNewOrder = useCallback((payload: Record<string, unknown>) => {
        setPendingOrders(prev => {
            const id = payload.orderId as string;
            if (prev.some(o => o.id === id)) return prev;
            return [{
                id,
                customerName: (payload.customerName as string) ?? "Customer",
                itemCount: (payload.itemCount as number) ?? 1,
                totalAmount: (payload.totalAmount as number) ?? 0,
                createdAt: (payload.createdAt as string) ?? new Date().toISOString()
            }, ...prev];
        });
    }, []);

    useKitchenSSE({
        kitchenId,
        onNewOrder: handleNewOrder,
    });

    const updateOrderStatus = async (orderId: string, status: OrderStatus, reason?: string) => {
        const res = await fetch(`/api/orders/${orderId}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status, notes: reason })
        });
        if (!res.ok) {
            throw res;
        }
    };

    const acceptOrder = async (orderId: string) => {
        await updateOrderStatus(orderId, 'ACCEPTED');
        dismissOrder(orderId);
    };

    const rejectOrder = async (orderId: string, reason?: string) => {
        await updateOrderStatus(orderId, 'CANCELLED', reason);
        dismissOrder(orderId);
    };

    const dismissOrder = useCallback((orderId: string) => {
        setPendingOrders(prev => prev.filter(o => o.id !== orderId));
    }, []);

    return (
        <IncomingOrderContext.Provider value={{ pendingOrders, acceptOrder, rejectOrder, dismissOrder }}>
            {children}
            {/* Render toasts in a portal using fixed positioning */}
            <div className="fixed bottom-6 right-6 z-[9999] flex flex-col-reverse gap-4 pointer-events-none">
                {pendingOrders.slice(0, 3).map((order, idx) => (
                    <div key={order.id} className="pointer-events-auto" style={{ zIndex: 100 - idx, transform: `translateY(${idx * -4}px)` }}>
                        <IncomingOrderToast order={order} />
                    </div>
                ))}
            </div>
        </IncomingOrderContext.Provider>
    );
}
