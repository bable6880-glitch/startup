"use client";

import { useAuth } from "@/lib/firebase/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

interface SubscriptionGuardProps {
    children: ReactNode;
    kitchenStatus: string | null;
}

/**
 * Dashboard-level guard that enforces paid-first access control.
 *
 * If the kitchen status is INACTIVE (no active subscription),
 * all dashboard routes EXCEPT /dashboard/subscription are blocked
 * and the user is redirected to the subscription page.
 *
 * This prevents unpaid kitchens from accessing seller tools.
 */
export function SubscriptionGuard({ children, kitchenStatus }: SubscriptionGuardProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [isAllowed, setIsAllowed] = useState<boolean | null>(null);

    useEffect(() => {
        // If kitchen status is not loaded yet, wait
        if (kitchenStatus === null) {
            return;
        }

        // Allow access to subscription page always (so they can pay)
        const isSubscriptionPage = pathname === "/dashboard/subscription" ||
            pathname.startsWith("/dashboard/subscription/");

        if (isSubscriptionPage) {
            setIsAllowed(true);
            return;
        }

        // If kitchen is INACTIVE, redirect to subscription page
        if (kitchenStatus === "INACTIVE") {
            router.replace("/dashboard/subscription?onboarding=true");
            setIsAllowed(false);
            return;
        }

        // Kitchen is ACTIVE or SUSPENDED (SUSPENDED has its own lockout logic)
        setIsAllowed(true);
    }, [kitchenStatus, pathname, router]);

    // Still loading kitchen status
    if (isAllowed === null) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        Checking subscription...
                    </p>
                </div>
            </div>
        );
    }

    // Blocked — show nothing while redirecting
    if (!isAllowed) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        Redirecting to subscription...
                    </p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
