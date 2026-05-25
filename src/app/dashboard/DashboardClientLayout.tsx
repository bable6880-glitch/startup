"use client";

import { RoleGuard } from "@/components/auth/RoleGuard";
import { SubscriptionGuard } from "@/components/dashboard/SubscriptionGuard";
import { type ReactNode, useEffect, useState, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/firebase/auth-context";
import { useKitchenSSE } from "@/hooks/use-kitchen-sse";
import { OrderPopup, OrderPopupData } from "@/components/dashboard/OrderPopup";

export default function DashboardLayout({ children }: { children: ReactNode }) {
    const { user, getIdToken } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [kitchenId, setKitchenId] = useState<string | null>(null);
    const [kitchenName, setKitchenName] = useState<string>("Your Kitchen");
    const [kitchenStatus, setKitchenStatus] = useState<string | null>(null);
    const [pendingOrder, setPendingOrder] = useState<OrderPopupData | null>(null);
    const popupShownRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        const fetchKitchen = async () => {
            if (!user) return;
            try {
                const token = await getIdToken();
                const res = await fetch("/api/kitchens?ownerId=me", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.data && data.data.length > 0) {
                        setKitchenId(data.data[0].id);
                        setKitchenName(data.data[0].name);
                        setKitchenStatus(data.data[0].status);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch kitchen in layout", err);
            }
        };
        fetchKitchen();
    }, [user, getIdToken]);

    const handleNewOrder = useCallback((payload: Record<string, unknown>) => {
        const orderId = payload.orderId as string;
        if (popupShownRef.current.has(orderId)) return;
        
        // Suppress if on orders page
        if (pathname === "/dashboard/orders" || pathname.startsWith("/dashboard/orders/")) {
            return;
        }

        popupShownRef.current.add(orderId);
        setPendingOrder({
            id: orderId,
            customerName: (payload.customerName as string) ?? "Customer",
            itemCount: (payload.itemCount as number) ?? 1,
            totalAmount: (payload.totalAmount as number) ?? 0,
            kitchenName: kitchenName,
        });
    }, [pathname, kitchenName]);

    useKitchenSSE({
        kitchenId,
        onNewOrder: handleNewOrder,
    });

    const handleViewOrder = () => {
        setPendingOrder(null);
        router.push("/dashboard/orders");
    };

    const handleDismiss = () => {
        setPendingOrder(null);
    };

    return (
        <RoleGuard allowedRoles={["COOK", "ADMIN"]} redirectTo="/account">
            {/* SEO: Prevent search engines from indexing private seller pages */}
            <head>
                <meta name="robots" content="noindex,nofollow" />
                <title>Seller Dashboard – Manage Your Tiffin Service & Meal Delivery</title>
            </head>
            <SubscriptionGuard kitchenStatus={kitchenStatus}>
                {children}
            </SubscriptionGuard>

            {pendingOrder && (
                <OrderPopup
                    order={pendingOrder}
                    onView={handleViewOrder}
                    onDismiss={handleDismiss}
                />
            )}
        </RoleGuard>
    );
}

