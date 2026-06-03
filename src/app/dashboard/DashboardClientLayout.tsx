"use client";

import { RoleGuard } from "@/components/auth/RoleGuard";
import { SubscriptionGuard } from "@/components/dashboard/SubscriptionGuard";
import { type ReactNode, useEffect, useState, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/firebase/auth-context";
import { IncomingOrderProvider } from "@/contexts/IncomingOrderContext";

export default function DashboardLayout({ children }: { children: ReactNode }) {
    const { user, getIdToken } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [kitchenId, setKitchenId] = useState<string | null>(null);
    const [kitchenName, setKitchenName] = useState<string>("Your Kitchen");
    const [kitchenStatus, setKitchenStatus] = useState<string | null>(null);
    const [kitchenFetchError, setKitchenFetchError] = useState(false);

    useEffect(() => {
        const fetchKitchen = async () => {
            if (!user) return;
            try {
                const token = await getIdToken();
                const res = await fetch("/api/kitchens?ownerId=me", {
                    headers: { Authorization: `Bearer ${token}` },
                    signal: AbortSignal.timeout(10000), // 10 second max
                    cache: 'no-store',
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
                console.error("[DashboardClientLayout] Kitchen fetch failed:", err);
                setKitchenFetchError(true);
            }
        };
        fetchKitchen();
    }, [user, getIdToken]);

    return (
        <RoleGuard allowedRoles={["COOK", "ADMIN"]} redirectTo="/account">
            {/* SEO: Prevent search engines from indexing private seller pages */}
            <head>
                <meta name="robots" content="noindex,nofollow" />
                <title>Seller Dashboard – Manage Your Tiffin Service & Meal Delivery</title>
            </head>
            <SubscriptionGuard kitchenStatus={kitchenStatus} fetchError={kitchenFetchError}>
                <IncomingOrderProvider kitchenId={kitchenId}>
                    {children}
                </IncomingOrderProvider>
            </SubscriptionGuard>
        </RoleGuard>
    );
}

