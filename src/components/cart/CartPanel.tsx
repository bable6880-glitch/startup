"use client";

import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/firebase/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { OrderSuccessCard } from "./OrderSuccessCard";
import { useLocation } from "@/lib/location-context";

export function CartPanel() {
    const { items, total, itemCount, kitchenName, kitchenId, updateQuantity, removeItem, clearCart } = useCart();
    const { user, userProfile, loading: authLoading, getIdToken } = useAuth();
    const { location, requestLocation } = useLocation();
    const router = useRouter();
    const pathname = usePathname();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    
    // Order Success State
    const [successData, setSuccessData] = useState<{ id: string } | null>(null);

    // Sellers (COOK role) cannot order — hide the entire cart
    const isCook = user?.role === "COOK" || user?.role === "ADMIN";

    const proceedToCheckout = async () => {
        if (itemCount === 0) return;

        if (!user && !authLoading) {
            router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
            return;
        }

        setIsSubmitting(true);
        setError(null);

        if (location.status !== 'granted') {
            requestLocation();
            setError("Please allow location access to place your order");
            setIsSubmitting(false);
            return;
        }

        try {
            const token = await getIdToken();
            if (!token) {
                setError("Authentication failed. Please log in again.");
                setIsSubmitting(false);
                return;
            }

            const res = await fetch("/api/orders", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    kitchenId,
                    items: items.map(i => ({
                        mealId: i.mealId,
                        quantity: i.quantity,
                    })),
                    // deliveryMode is auto-resolved on the server from kitchen config
                    notes: "",
                    customerLat: location.lat,
                    customerLng: location.lng,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error?.message || "Failed to place order");
            }

            const responseData = await res.json();

            clearCart();
            // Show new Smart Modal instead of redirecting instantly
            setSuccessData({ id: responseData.data.id });

        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Don't render anything if empty, or if the user is a Cook
    // Except if we are currently showing the success modal!
    if ((itemCount === 0 && !successData) || isCook) {
        return null;
    }

    if (successData && userProfile) {
        return (
            <OrderSuccessCard
                orderId={successData.id}
                customerName={userProfile.name ?? "Guest"}
                customerPhone={userProfile.phone ?? ""}
                onClose={() => setSuccessData(null)}
            />
        );
    }

    return (
        <>
            {/* Mobile Toggle Button (Sticky Bottom) */}
            <div className="fixed bottom-4 right-4 z-40 md:hidden">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-2 rounded-full bg-primary-600 px-6 py-3 text-white shadow-lg shadow-primary-500/30 transition-transform active:scale-95"
                >
                    <span className="font-bold">{itemCount} items</span>
                    <span>&bull;</span>
                    <span className="font-bold">Rs. {total}</span>
                </button>
            </div>

            {/* Cart Sidebar */}
            <div
                className={`fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-white shadow-2xl transition-transform duration-300 dark:bg-neutral-900 md:translate-x-0 ${isOpen ? "translate-x-0" : "translate-x-full md:translate-x-0"
                    } md:sticky md:top-24 md:h-[calc(100vh-8rem)] md:rounded-2xl md:border md:border-neutral-200 md:shadow-none dark:border-neutral-800`}
            >
                <div className="flex h-full flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4 dark:border-neutral-800">
                        <div>
                            <h2 className="text-lg font-bold text-neutral-900 dark:text-white">Your Cart</h2>
                            <p className="text-xs text-neutral-500 line-clamp-1 dark:text-neutral-400">from {kitchenName}</p>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-2 text-neutral-500 hover:bg-neutral-100 rounded-lg md:hidden dark:text-neutral-400 dark:hover:bg-neutral-800"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Items List */}
                    <div className="flex-1 overflow-y-auto px-5 py-2">
                        {items.map((item) => (
                            <div key={item.mealId} className="flex gap-4 py-4 border-b border-neutral-100 last:border-0 dark:border-neutral-800">
                                {item.imageUrl ? (
                                    <div className="h-16 w-16 shrink-0 rounded-lg bg-neutral-100 overflow-hidden">
                                        <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                                    </div>
                                ) : (
                                    <div className="h-16 w-16 shrink-0 rounded-lg bg-neutral-100 flex items-center justify-center text-xl dark:bg-neutral-800">
                                        🍱
                                    </div>
                                )}

                                <div className="flex-1 min-w-0">
                                    <h3 className="font-medium text-neutral-900 truncate dark:text-neutral-200">{item.name}</h3>
                                    <p className="text-sm text-neutral-500 dark:text-neutral-400">Rs. {item.price * item.quantity}</p>

                                    <div className="mt-2 flex items-center gap-3">
                                        <div className="flex items-center rounded-lg border border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800">
                                            <button
                                                onClick={() => updateQuantity(item.mealId, item.quantity - 1)}
                                                className="px-2 py-1 text-sm font-medium hover:bg-neutral-200 transition-colors dark:hover:bg-neutral-700"
                                            >
                                                −
                                            </button>
                                            <span className="w-6 text-center text-xs font-semibold">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.mealId, item.quantity + 1)}
                                                className="px-2 py-1 text-sm font-medium hover:bg-neutral-200 transition-colors dark:hover:bg-neutral-700"
                                            >
                                                +
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => removeItem(item.mealId)}
                                            className="text-xs text-red-500 hover:text-red-700 font-medium"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Footer / Checkout — no delivery mode toggle */}
                    <div className="border-t border-neutral-100 p-5 bg-neutral-50 dark:bg-neutral-900/50 dark:border-neutral-800/50">
                        {userProfile && (
                            <div className="mb-4 rounded-xl bg-white p-4 shadow-sm border border-neutral-100 dark:bg-neutral-800 dark:border-neutral-700">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-widest dark:text-neutral-100">Delivery Details</h4>
                                    <Link href="/account" className="text-[11px] font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400">Edit</Link>
                                </div>
                                <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{userProfile.name} • {userProfile.phone}</p>
                                <p className="text-xs text-neutral-500 mt-0.5 truncate dark:text-neutral-400">{userProfile.defaultAddress}, {userProfile.defaultCity}</p>
                            </div>
                        )}

                        <div className="flex items-center justify-between mb-4">
                            <span className="text-neutral-600 dark:text-neutral-400">Total</span>
                            <span className="text-xl font-bold text-neutral-900 dark:text-white">Rs. {total}</span>
                        </div>

                        {error && (
                            <div className="mb-3 rounded-lg bg-red-50 p-2 text-xs text-red-600 dark:bg-red-900/20 dark:text-red-300">
                                {error}
                            </div>
                        )}

                        <button
                            onClick={proceedToCheckout}
                            disabled={isSubmitting}
                            className="w-full rounded-xl bg-primary-600 py-3.5 text-sm font-bold text-white shadow-md shadow-primary-500/20 transition-all hover:bg-primary-700 hover:shadow-lg active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? "Placing Order..." : `Checkout • Rs. ${total}`}
                        </button>
                    </div>
                </div>
            </div>

            {/* Backdrop for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </>
    );
}
