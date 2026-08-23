"use client";

import { useAuth } from "@/lib/firebase/auth-context";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

function RefreshAfterDelay({ delayMs, onRefresh }: { delayMs: number; onRefresh?: () => void }) {
    const router = useRouter();
    useEffect(() => {
        const t = setTimeout(() => {
            if (onRefresh) {
                onRefresh();
            } else {
                router.refresh();
            }
        }, delayMs);
        return () => clearTimeout(t);
    }, [delayMs, router, onRefresh]);
    return null;
}

import { isKitchenTrialLocked, trialDaysRemaining } from "@/lib/utils/trial-lock";
import { isFreeModeActive } from "@/config/free-mode";

interface SubscriptionGuardProps {
    children: ReactNode;
    kitchen: any;
    fetchError?: boolean;
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
export function SubscriptionGuard({ children, kitchen, fetchError }: SubscriptionGuardProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { getIdToken } = useAuth();
    const [isAllowed, setIsAllowed] = useState<boolean | null>(null);

    const justSubscribed = searchParams.get('subscribed') === 'true';

    useEffect(() => {
        // If free mode is active, always allow dashboard access
        if (isFreeModeActive()) {
            setIsAllowed(true);
            return;
        }

        // If kitchen is not loaded yet, wait
        if (kitchen === null) {
            return;
        }

        const kitchenStatus = kitchen.status;

        // Allow access to subscription page always (so they can pay)
        const isSubscriptionPage = pathname === "/dashboard/subscription" ||
            pathname.startsWith("/dashboard/subscription/");

        if (isSubscriptionPage || pathname === '/dashboard/subscription/success') {
            setIsAllowed(true);
            return;
        }

        // If cook just completed payment AND kitchen is still INACTIVE,
        // show "Activating your kitchen..." instead of redirecting.
        // This handles the webhook delay edge case.
        if (kitchenStatus === "INACTIVE" && justSubscribed) {
            setIsAllowed(false);
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
    }, [kitchen, pathname, router, justSubscribed]);

    // Still loading kitchen status
    if (isAllowed === null) {
        if (kitchen === null && fetchError === true) {
            return (
                <div className="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-950">
                    <div className="text-center space-y-3 p-6 bg-white dark:bg-neutral-900 rounded-xl shadow-lg">
                        <p className="text-red-600 dark:text-red-400 font-medium">
                            Unable to load your kitchen data.
                        </p>
                        <p className="text-gray-500 dark:text-neutral-400 text-sm">
                            Please check your connection and try again.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm font-medium"
                        >
                            Refresh Page
                        </button>
                    </div>
                </div>
            );
        }

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

    // Pending activation
    if (!isAllowed && kitchen?.status === "INACTIVE" && justSubscribed) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-950">
                <div className="text-center space-y-4 p-8 bg-white dark:bg-neutral-900 rounded-2xl shadow-lg max-w-md w-full mx-4">
                    <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-neutral-100">
                        Activating your kitchen...
                    </h2>
                    <p className="text-gray-500 dark:text-neutral-400 text-sm">
                        Your payment was successful. We&apos;re setting up your plan. This takes just a moment.
                    </p>
                    <RefreshAfterDelay 
                        delayMs={3000} 
                        onRefresh={async () => {
                            // Fetch directly from API to bypass client layout state
                            try {
                                const token = await getIdToken();
                                if (!token) return window.location.reload();
                                
                                const res = await fetch("/api/kitchens?ownerId=me", {
                                    headers: { Authorization: `Bearer ${token}` }
                                });
                                if (res.ok) {
                                    const data = await res.json();
                                    if (data.data && data.data[0]?.status === 'ACTIVE') {
                                        // Hard reload to reset all layouts with new status
                                        window.location.href = '/dashboard';
                                        return;
                                    }
                                }
                            } catch (e) {
                                // ignore
                            }
                            window.location.reload();
                        }}
                    />
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

    return (
        <>
            {/* Trial Banner */}
            {kitchen && kitchen.planId === 'trial' && !isFreeModeActive() && (
                <div className={`px-6 py-3 border-b text-sm font-medium flex items-center justify-between ${
                    isKitchenTrialLocked(kitchen) 
                        ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/50' 
                        : 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800/50'
                }`}>
                    <div>
                        {isKitchenTrialLocked(kitchen) ? (
                            <>
                                <span className="font-bold">⚠️ Trial Expired:</span> Your kitchen is hidden and cannot receive orders.
                            </>
                        ) : (
                            <>
                                <span className="font-bold">Free Trial:</span> You have {trialDaysRemaining(kitchen)} days left in your free trial.
                            </>
                        )}
                    </div>
                    <button 
                        onClick={() => router.push('/dashboard/subscription')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-colors ${
                            isKitchenTrialLocked(kitchen)
                                ? 'bg-red-600 hover:bg-red-700 text-white dark:bg-red-700 dark:hover:bg-red-600'
                                : 'bg-orange-600 hover:bg-orange-700 text-white dark:bg-orange-700 dark:hover:bg-orange-600'
                        }`}
                    >
                        Upgrade Plan
                    </button>
                </div>
            )}
            {children}
        </>
    );
}
