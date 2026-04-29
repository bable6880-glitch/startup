"use client";

import { useAuth } from "@/lib/firebase/auth-context";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useCallback, Suspense } from "react";
import { SUBSCRIPTION_PLANS } from "@/lib/validations/subscription";
import { BackButton } from "@/components/ui/BackButton";

// ─── Types ──────────────────────────────────────────────────────────────────

type SubscriptionStatus = {
    status:
    | "TRIALING"
    | "ACTIVE"
    | "PAST_DUE"
    | "SUSPENDED"
    | "EXPIRED"
    | "CANCELLED"
    | "NONE";
    subscription: {
        id: string;
        currentPeriodEnd: string | null;
        autoRenew: boolean;
        paymentMethod: string;
        planType: string | null;
    } | null;
    trialEndsAt: string | null;
    isTrialUsed: boolean;
    daysRemaining: number;
    gracePeriodEndsAt: string | null;
    canAcceptOrders: boolean;
};

type PlanKey = keyof typeof SUBSCRIPTION_PLANS;

// TODO P6: JazzCash/Easypaisa integration
// Backend stub at /api/seller/subscription/checkout (501)
const PAYMENT_METHODS = [
    {
        id: "STRIPE" as const,
        label: "Credit/Debit Card",
        icon: "💳",
        available: true,
    }
];

// ─── Main Page Content ──────────────────────────────────────────────────────

function SubscriptionContent() {
    const { user, loading: authLoading, getIdToken } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    const statusParam = searchParams.get("status");

    const [subStatus, setSubStatus] = useState<SubscriptionStatus | null>(null);
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPlan, setSelectedPlan] = useState<string>("starter");
    const [selectedPayment, setSelectedPayment] = useState("STRIPE");
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    const [trialLoading, setTrialLoading] = useState(false);
    const [cancelLoading, setCancelLoading] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelReason, setCancelReason] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Show success/cancel message from redirect
    useEffect(() => {
        if (statusParam === "success") {
            setSuccessMessage(
                "🎉 Payment successful! Your subscription is now active."
            );
        } else if (statusParam === "cancelled") {
            setError("Payment was cancelled. You can try again anytime.");
        }
    }, [statusParam]);

    // Load subscription status
    const loadData = useCallback(async () => {
        try {
            const token = await getIdToken();
            if (!token) return;

            const [statusRes, plansRes] = await Promise.all([
                fetch("/api/seller/subscription/status", {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                fetch("/api/plans")
            ]);

            if (statusRes.ok) {
                const data = await statusRes.json();
                setSubStatus(data.data);
            }
            if (plansRes.ok) {
                const data = await plansRes.json();
                setPlans(data.plans || []);
            }
        } catch (err) {
            console.error("Failed to load subscription data:", err);
        } finally {
            setLoading(false);
        }
    }, [getIdToken]);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/login?redirect=/dashboard/subscription");
            return;
        }
        if (user) loadData();
    }, [user, authLoading, router, loadData]);

    // ── Start Free Trial ──
    const handleStartTrial = async () => {
        setTrialLoading(true);
        setError(null);
        try {
            const token = await getIdToken();
            if (!token) return;

            const res = await fetch("/api/seller/subscription/trial", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (res.ok) {
                setSuccessMessage(
                    "🎉 Your 30-day free trial has started!"
                );
                await loadData();
            } else {
                const data = await res.json();
                setError(data.error?.message || "Failed to start trial");
            }
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setTrialLoading(false);
        }
    };

    // ── Checkout ──
    const handleCheckout = async () => {
        setCheckoutLoading(true);
        setError(null);
        try {
            const token = await getIdToken();
            if (!token) return;

            const res = await fetch("/api/seller/subscription/checkout", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    planId: selectedPlan,
                    paymentMethod: selectedPayment,
                }),
            });

            const data = await res.json();

            if (data.success && data.data?.url) {
                window.location.href = data.data.url;
            } else if (data.data?.status === "COMING_SOON") {
                setError(data.data.message);
            } else {
                setError(
                    data.error?.message || "Failed to create checkout session"
                );
            }
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setCheckoutLoading(false);
        }
    };

    // ── Cancel ──
    const handleCancel = async () => {
        if (!subStatus?.subscription) return;
        setCancelLoading(true);
        setError(null);
        try {
            const token = await getIdToken();
            if (!token) return;

            const res = await fetch("/api/seller/subscription/cancel", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    subscriptionId: subStatus.subscription.id,
                    reason: cancelReason || undefined,
                }),
            });

            if (res.ok) {
                setSuccessMessage(
                    "Subscription auto-renewal cancelled. You can continue using the service until the current period ends."
                );
                setShowCancelModal(false);
                setCancelReason("");
                await loadData();
            } else {
                const data = await res.json();
                setError(data.error?.message || "Failed to cancel");
            }
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setCancelLoading(false);
        }
    };

    // ── Loading State ──
    if (authLoading || loading) {
        return (
            <div className="mx-auto max-w-4xl px-4 py-8">
                <div className="animate-pulse-soft space-y-6">
                    <div className="h-8 w-64 rounded-lg animate-shimmer" />
                    <div className="h-40 rounded-2xl animate-shimmer" />
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="h-60 rounded-2xl animate-shimmer"
                            />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const hasActiveSub =
        subStatus?.status === "ACTIVE" || subStatus?.status === "TRIALING";
    const isPastDue = subStatus?.status === "PAST_DUE";
    const isSuspended = subStatus?.status === "SUSPENDED";
    const canStartTrial =
        subStatus?.status === "NONE" && !subStatus?.isTrialUsed;

    return (
        <div className="mx-auto max-w-4xl px-4 py-8">
            <BackButton label="Dashboard" />
            {/* Header */}
            <div className="mb-8 mt-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-50">
                    Subscription
                </h1>
                <p className="mt-1 text-neutral-500 dark:text-neutral-400">
                    Manage your kitchen subscription and billing
                </p>
            </div>

            {/* Success / Error Banners */}
            {successMessage && (
                <div className="mb-6 rounded-xl bg-accent-50 border border-accent-200 px-4 py-3 text-sm text-accent-800 animate-slide-up dark:bg-accent-900/30 dark:border-accent-800 dark:text-accent-300">
                    {successMessage}
                    <button
                        onClick={() => setSuccessMessage(null)}
                        className="ml-2 text-accent-600 hover:text-accent-800 font-medium"
                    >
                        ✕
                    </button>
                </div>
            )}

            {error && (
                <div className="mb-6 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800 animate-slide-up dark:bg-red-900/30 dark:border-red-800 dark:text-red-300">
                    {error}
                    <button
                        onClick={() => setError(null)}
                        className="ml-2 text-red-600 hover:text-red-800 font-medium"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Current Status Card */}
            <div className="mb-8 rounded-2xl border border-neutral-200/60 bg-white p-6 shadow-sm dark:bg-neutral-800 dark:border-neutral-700">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-4">
                    Current Plan
                </h2>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <StatusBadge status={subStatus?.status || "NONE"} />
                        {subStatus?.daysRemaining !== undefined &&
                            subStatus.daysRemaining > 0 && (
                                <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                                    {subStatus.daysRemaining} days remaining
                                    {subStatus.subscription?.currentPeriodEnd &&
                                        ` · Renews ${new Date(subStatus.subscription.currentPeriodEnd).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" })}`}
                                </p>
                            )}
                        {subStatus?.status === "TRIALING" &&
                            subStatus.trialEndsAt && (
                                <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                                    Trial ends{" "}
                                    {new Date(
                                        subStatus.trialEndsAt
                                    ).toLocaleDateString("en-PK", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                    })}
                                </p>
                            )}
                        {isPastDue && subStatus.gracePeriodEndsAt && (
                            <p className="mt-2 text-sm text-amber-600 dark:text-amber-400 font-medium">
                                ⚠️ Payment overdue — kitchen will be
                                suspended on{" "}
                                {new Date(
                                    subStatus.gracePeriodEndsAt
                                ).toLocaleDateString("en-PK", {
                                    day: "numeric",
                                    month: "short",
                                })}
                            </p>
                        )}
                        {isSuspended && (
                            <p className="mt-2 text-sm text-red-600 dark:text-red-400 font-medium">
                                🚫 Kitchen suspended — renew to accept
                                orders again
                            </p>
                        )}
                    </div>
                    {hasActiveSub && subStatus?.subscription?.autoRenew && (
                        <button
                            onClick={() => setShowCancelModal(true)}
                            className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
                        >
                            Cancel auto-renewal
                        </button>
                    )}
                </div>
            </div>

            {/* Free Trial Banner */}
            {canStartTrial && (
                <div className="mb-8 rounded-2xl border-2 border-dashed border-primary-300 bg-gradient-to-r from-primary-50 to-amber-50 p-6 dark:from-primary-900/20 dark:to-amber-900/20 dark:border-primary-700">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-bold text-primary-700 dark:text-primary-300">
                                🎁 First Month FREE!
                            </h3>
                            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                                Try Smart Tiffin for 30 days — no payment
                                required
                            </p>
                        </div>
                        <button
                            onClick={handleStartTrial}
                            disabled={trialLoading}
                            className="rounded-xl bg-primary-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
                        >
                            {trialLoading ? (
                                <span className="flex items-center gap-2">
                                    <Spinner /> Starting…
                                </span>
                            ) : (
                                "Start Free Trial"
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Plan Selection */}
            <section className="mb-8">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-4">
                    {hasActiveSub
                        ? "Switch Plan"
                        : "Choose Your Plan"}
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {plans.map((plan) => {
                        const isSelected = selectedPlan === plan.planId;
                        const isRecommended = plan.planId === "pro";

                        return (
                            <button
                                key={plan.id}
                                onClick={() => setSelectedPlan(plan.planId)}
                                className={`relative rounded-2xl border-2 p-5 text-left transition-all ${isSelected
                                    ? "border-primary-500 bg-primary-50/50 shadow-md dark:bg-primary-900/20"
                                    : "border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-sm dark:bg-neutral-800 dark:border-neutral-700 dark:hover:border-neutral-600"
                                    }`}
                            >
                                {isRecommended && (
                                    <span className="absolute -top-2.5 left-4 rounded-full bg-primary-500 px-3 py-0.5 text-xs font-bold text-white shadow-sm">
                                        RECOMMENDED
                                    </span>
                                )}
                                <div className="mb-3">
                                    <h3 className="font-bold text-neutral-900 dark:text-neutral-50">
                                        {plan.displayName}
                                    </h3>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                        {plan.description}
                                    </p>
                                </div>
                                <div className="mb-2">
                                    <span className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
                                        Rs {plan.priceRs}
                                    </span>
                                </div>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                    /{plan.billingPeriodMonths === 1 ? 'month' : `${plan.billingPeriodMonths} months`}
                                </p>
                                {isSelected && (
                                    <div className="absolute top-4 right-4 flex h-6 w-6 items-center justify-center rounded-full bg-primary-500 text-white text-xs">
                                        ✓
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </section>

            {/* Payment Method */}
            <section className="mb-8">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-4">
                    Payment Method
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {PAYMENT_METHODS.map((method) => (
                        <button
                            key={method.id}
                            onClick={() => {
                                if (method.available) {
                                    setSelectedPayment(method.id);
                                }
                            }}
                            disabled={!method.available}
                            className={`relative rounded-xl border-2 p-4 text-left transition-all ${selectedPayment === method.id
                                ? "border-primary-500 bg-primary-50/50 dark:bg-primary-900/20"
                                : method.available
                                    ? "border-neutral-200 bg-white hover:border-neutral-300 dark:bg-neutral-800 dark:border-neutral-700"
                                    : "border-neutral-100 bg-neutral-50 opacity-60 cursor-not-allowed dark:bg-neutral-900 dark:border-neutral-800"
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-xl">
                                    {method.icon}
                                </span>
                                <div>
                                    <p className="font-medium text-neutral-900 dark:text-neutral-100 text-sm">
                                        {method.label}
                                    </p>
                                    {!method.available && (
                                        <p className="text-xs text-neutral-400">
                                            Coming Soon
                                        </p>
                                    )}
                                </div>
                            </div>
                            {selectedPayment === method.id && (
                                <div className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-white text-xs">
                                    ✓
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </section>

            {/* Checkout Button */}
            <div className="flex flex-col sm:flex-row gap-3">
                <button
                    onClick={handleCheckout}
                    disabled={checkoutLoading || (!hasActiveSub && canStartTrial)}
                    className="flex-1 rounded-xl bg-primary-500 px-6 py-3 text-sm font-semibold text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
                >
                    {checkoutLoading ? (
                        <span className="flex items-center justify-center gap-2">
                            <Spinner /> Processing…
                        </span>
                    ) : hasActiveSub ? (
                        `Switch to ${plans.find(p => p.planId === selectedPlan)?.displayName || 'Selected'} Plan`
                    ) : (
                        `Subscribe — Rs ${plans.find(p => p.planId === selectedPlan)?.priceRs || 0}`
                    )}
                </button>
                <button
                    onClick={() => router.push("/dashboard")}
                    className="rounded-xl border border-neutral-200 bg-white px-6 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-all dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300"
                >
                    Back to Dashboard
                </button>
            </div>

            {/* Plan Features */}
            <section className="mt-10">
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50 mb-4">
                    What&apos;s Included
                </h2>
                <div className="rounded-2xl border border-neutral-200/60 bg-white p-6 dark:bg-neutral-800 dark:border-neutral-700">
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        {[
                            "Kitchen listing on platform",
                            "Full menu management",
                            "Order notifications & tracking",
                            "Customer reviews & replies",
                            "Basic analytics dashboard",
                            "WhatsApp integration",
                            "Mobile-optimized dashboard",
                            "Priority customer support",
                        ].map((feature) => (
                            <li
                                key={feature}
                                className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300"
                            >
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-100 text-accent-600 text-xs dark:bg-accent-900/30 dark:text-accent-400">
                                    ✓
                                </span>
                                {feature}
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            {/* Cancel Modal */}
            {showCancelModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-neutral-800 animate-slide-up">
                        <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-50">
                            Cancel Auto-Renewal?
                        </h3>
                        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                            Your subscription will remain active until the
                            current billing period ends. After that, your
                            kitchen will be suspended.
                        </p>
                        <textarea
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            placeholder="Tell us why you're cancelling (optional)"
                            className="mt-4 w-full rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200"
                            rows={3}
                        />
                        <div className="mt-4 flex gap-3">
                            <button
                                onClick={handleCancel}
                                disabled={cancelLoading}
                                className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50 transition-all"
                            >
                                {cancelLoading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <Spinner /> Cancelling…
                                    </span>
                                ) : (
                                    "Confirm Cancellation"
                                )}
                            </button>
                            <button
                                onClick={() => setShowCancelModal(false)}
                                className="flex-1 rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-300 transition-all"
                            >
                                Keep Subscription
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Helper Components ──────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
    const config: Record<
        string,
        { label: string; className: string; icon: string }
    > = {
        TRIALING: {
            label: "Free Trial",
            className:
                "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
            icon: "🎁",
        },
        ACTIVE: {
            label: "Active",
            className:
                "bg-accent-50 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300",
            icon: "✅",
        },
        PAST_DUE: {
            label: "Payment Overdue",
            className:
                "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
            icon: "⚠️",
        },
        SUSPENDED: {
            label: "Suspended",
            className:
                "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300",
            icon: "🚫",
        },
        EXPIRED: {
            label: "Expired",
            className:
                "bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300",
            icon: "⏰",
        },
        CANCELLED: {
            label: "Cancelled",
            className:
                "bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300",
            icon: "❌",
        },
        NONE: {
            label: "No Subscription",
            className:
                "bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300",
            icon: "📋",
        },
    };

    const c = config[status] || config.NONE;

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${c.className}`}
        >
            <span>{c.icon}</span>
            {c.label}
        </span>
    );
}

function Spinner() {
    return (
        <svg
            className="animate-spin h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
        >
            <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
            />
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
        </svg>
    );
}

// ─── Export with Suspense ───────────────────────────────────────────────────

export default function SubscriptionPage() {
    return (
        <Suspense
            fallback={
                <div className="mx-auto max-w-4xl px-4 py-8">
                    <div className="animate-pulse-soft space-y-6">
                        <div className="h-8 w-64 rounded-lg animate-shimmer" />
                        <div className="h-40 rounded-2xl animate-shimmer" />
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            {[1, 2, 3].map((i) => (
                                <div
                                    key={i}
                                    className="h-60 rounded-2xl animate-shimmer"
                                />
                            ))}
                        </div>
                    </div>
                </div>
            }
        >
            <SubscriptionContent />
        </Suspense>
    );
}
