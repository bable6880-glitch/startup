"use client";

import { useState } from "react";
import { useAuth } from "@/lib/firebase/auth-context";
import { useRouter } from "next/navigation";

interface PaymentMethodSelectorProps {
    orderId: string;
    currentMethod: string;
    paymentStatus: string;
    totalAmount: number;
}

export function PaymentMethodSelector({ orderId, currentMethod, paymentStatus, totalAmount }: PaymentMethodSelectorProps) {
    const { getIdToken } = useAuth();
    const router = useRouter();
    const [selectedMethod, setSelectedMethod] = useState(currentMethod);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const methods = [
        { id: "COD", name: "Cash on Delivery", icon: "💵", available: true },
        { id: "STRIPE", name: "Credit/Debit Card", icon: "💳", available: true },
        { id: "JAZZCASH", name: "JazzCash", icon: "📱", available: false },
        { id: "EASYPAISA", name: "Easypaisa", icon: "🟢", available: false },
        { id: "SADAPAY", name: "SadaPay", icon: "🔵", available: false },
    ];

    const handlePayment = async () => {
        setIsLoading(true);
        setError(null);
        setMessage(null);

        try {
            const token = await getIdToken();
            const res = await fetch("/api/orders/payment", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    orderId,
                    paymentMethod: selectedMethod,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                if (res.status === 501) {
                    setError(data.error);
                } else {
                    setError(data.error || "Failed to update payment method.");
                }
                return;
            }

            if (selectedMethod === "STRIPE") {
                if (data.data?.redirectUrl) {
                    window.location.href = data.data.redirectUrl;
                } else {
                    setMessage("Stripe payment initiated. Please check your email or proceed to checkout if redirected.");
                }
            } else {
                setMessage(data.data?.message || "Payment method updated successfully.");
                router.refresh();
            }
        } catch (err) {
            setError("Network error. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    if (paymentStatus === "PAID") {
        return (
            <div className="rounded-2xl border border-green-200 bg-green-50 p-6 dark:bg-green-900/10 dark:border-green-900/50">
                <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white">✓</span>
                    <div>
                        <p className="font-bold text-green-800 dark:text-green-400">Payment Completed</p>
                        <p className="text-sm text-green-700 dark:text-green-500">Paid via {currentMethod}</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:bg-neutral-800 dark:border-neutral-700">
            <h2 className="font-bold text-sm text-neutral-500 uppercase tracking-wide mb-4 dark:text-neutral-400">Payment</h2>
            
            <div className="space-y-3 mb-6">
                {methods.map((method) => (
                    <label
                        key={method.id}
                        className={`flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all ${
                            selectedMethod === method.id
                                ? "border-primary-500 bg-primary-50 ring-1 ring-primary-500 dark:bg-primary-900/20"
                                : "border-neutral-200 hover:border-primary-200 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
                        } ${!method.available && selectedMethod !== method.id ? "opacity-60 grayscale" : ""}`}
                    >
                        <div className="flex items-center gap-3">
                            <input
                                type="radio"
                                name="paymentMethod"
                                value={method.id}
                                checked={selectedMethod === method.id}
                                onChange={() => {
                                    setSelectedMethod(method.id);
                                    setError(null);
                                    setMessage(null);
                                }}
                                className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-xl">{method.icon}</span>
                            <div>
                                <p className="font-medium text-neutral-900 dark:text-white">{method.name}</p>
                                {!method.available && (
                                    <p className="text-xs text-primary-600 dark:text-primary-400 font-semibold">Coming Soon</p>
                                )}
                            </div>
                        </div>
                    </label>
                ))}
            </div>

            {error && (
                <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400 border border-red-100 dark:border-red-900/50">
                    {error}
                </div>
            )}

            {message && (
                <div className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400 border border-green-100 dark:border-green-900/50">
                    {message}
                </div>
            )}

            <button
                onClick={handlePayment}
                disabled={isLoading}
                className="w-full rounded-xl bg-neutral-900 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-neutral-800 active:scale-[0.98] disabled:opacity-70 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
                {isLoading ? "Processing..." : `Confirm Payment • Rs. ${totalAmount}`}
            </button>
        </div>
    );
}
