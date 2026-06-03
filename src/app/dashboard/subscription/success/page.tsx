// src/app/dashboard/subscription/success/page.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/firebase/auth-context";
import { broadcastPlanUpdate } from "@/hooks/use-plan-access";

type State = "VERIFYING" | "ACTIVATING" | "REDIRECTING" | "DONE";

export default function SubscriptionSuccessPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { refreshUser, getIdToken } = useAuth();
    
    const sessionId = searchParams.get("session_id");
    const [state, setState] = useState<State>("VERIFYING");
    const [error, setError] = useState<string | null>(null);
    const attempts = useRef(0);

    useEffect(() => {
        if (!sessionId) {
            router.replace("/dashboard/subscription?error=missing_session");
            return;
        }

        let isMounted = true;
        let pollTimer: NodeJS.Timeout;

        const verifySession = async () => {
            try {
                const token = await getIdToken();
                if (!token) return;

                const res = await fetch(`/api/seller/subscription/verify?session_id=${sessionId}`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                
                if (!res.ok) {
                    if (res.status === 401 || res.status === 403) {
                        router.replace("/dashboard/subscription?error=unauthorized");
                        return;
                    }
                    throw new Error("Verification failed");
                }

                const data = await res.json();

                if (data.isVerified && data.kitchenStatus === 'ACTIVE') {
                    if (!isMounted) return;
                    setState("ACTIVATING");
                    
                    // a. Call refreshUser
                    if (refreshUser) await refreshUser();
                    
                    // b. Invalidate caches (React Query / SWR conceptually, or trigger refetches)
                    // (Assuming global cache invalidation or relying on broadcastPlanUpdate)
                    
                    // c. Call broadcastPlanUpdate
                    broadcastPlanUpdate();
                    
                    // d. Wait 500ms
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    if (!isMounted) return;
                    setState("REDIRECTING");
                    
                    // e. Hard reload to dashboard to force state reset
                    window.location.href = "/dashboard?subscribed=true";
                    setState("DONE");
                    return;
                }

                if (!data.isVerified && data.paymentStatus === 'pending') {
                    attempts.current += 1;
                    if (attempts.current >= 10) {
                        router.replace("/dashboard/subscription?error=activation_timeout");
                        return;
                    }
                    if (isMounted) {
                        pollTimer = setTimeout(verifySession, 3000);
                    }
                } else if (!data.isVerified) {
                    router.replace(data.redirectTo || "/dashboard/subscription?error=payment_failed");
                } else if (data.isVerified && data.kitchenStatus === 'INACTIVE') {
                    // Repair mode failed to activate
                    router.replace("/dashboard/subscription?error=activation_failed");
                }

            } catch (err) {
                console.error("[SubscriptionSuccess] Verification error:", err);
                attempts.current += 1;
                if (attempts.current >= 10) {
                    router.replace("/dashboard/subscription?error=activation_timeout");
                    return;
                }
                if (isMounted) {
                    pollTimer = setTimeout(verifySession, 3000);
                }
            }
        };

        verifySession();

        return () => {
            isMounted = false;
            if (pollTimer) clearTimeout(pollTimer);
        };
    }, [sessionId, router, getIdToken, refreshUser]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-neutral-50 dark:bg-neutral-950">
            <div className="text-center space-y-4 p-8 bg-white dark:bg-neutral-900 rounded-2xl shadow-lg max-w-md w-full mx-4">
                <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-neutral-100">
                    {state === "VERIFYING" && "Confirming payment with bank..."}
                    {state === "ACTIVATING" && "Activating your kitchen..."}
                    {state === "REDIRECTING" && "Taking you to dashboard..."}
                    {state === "DONE" && "Done!"}
                </h2>
                <p className="text-gray-500 dark:text-neutral-400 text-sm">
                    Please do not close this window. This takes just a moment.
                </p>
            </div>
        </div>
    );
}

