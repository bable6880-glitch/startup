"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface PaymentMethodSheetProps {
    items: any[];
    total: number;
    kitchenId: string;
    customerLat?: number;
    customerLng?: number;
    getToken: () => Promise<string | null>;
    onClose: () => void;
    onSuccess: () => void; // Called after order is placed to clear cart etc.
}

export function PaymentMethodSheet({ items, total, kitchenId, customerLat, customerLng, getToken, onClose, onSuccess }: PaymentMethodSheetProps) {
    const router = useRouter();
    const [method, setMethod] = useState<"COD" | "STRIPE" | "JAZZCASH" | "EASYPAISA">("COD");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Card Details
    const [cardNumber, setCardNumber] = useState("");
    const [cardName, setCardName] = useState("");
    const [expiry, setExpiry] = useState("");
    const [cvv, setCvv] = useState("");

    // Wallet Details
    const [walletPhone, setWalletPhone] = useState("");

    const handlePlaceOrder = async () => {
        setIsSubmitting(true);
        setError(null);

        // Basic validation
        if (method === "STRIPE") {
            if (!cardNumber || !cardName || !expiry || !cvv) {
                setError("Please fill in all card details.");
                setIsSubmitting(false);
                return;
            }
        } else if (method === "JAZZCASH" || method === "EASYPAISA") {
            if (!walletPhone) {
                setError("Please enter your mobile account number.");
                setIsSubmitting(false);
                return;
            }
        }

        try {
            const token = await getToken();
            if (!token) throw new Error("Authentication required");

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
                    paymentMethod: method,
                    customerLat,
                    customerLng,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error?.message || "Failed to place order");
            }

            const responseData = await res.json();
            const orderId = responseData.data.id;

            onSuccess(); // Clear cart etc.
            
            // Navigate to the one-time confirmation page
            router.replace(`/orders/${orderId}/confirmation`);

        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center p-0 sm:p-6 animate-fade-in-up">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            
            <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-white dark:bg-neutral-900 rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col">
                <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-neutral-100 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md">
                    <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Complete your order</h2>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-500 transition-colors">
                        ✕
                    </button>
                </div>
                
                <div className="p-5 space-y-6">
                    {/* Order Summary */}
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3">Order summary</h3>
                        <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 border border-neutral-100 dark:border-neutral-800">
                            <div className="space-y-2 mb-3 pb-3 border-b border-neutral-200 dark:border-neutral-700">
                                {items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between text-sm">
                                        <span className="text-neutral-700 dark:text-neutral-300">
                                            <span className="font-semibold text-neutral-500 mr-2">{item.quantity}x</span>
                                            {item.name}
                                        </span>
                                        <span className="font-medium text-neutral-900 dark:text-white">Rs. {item.price * item.quantity}</span>
                                    </div>
                                ))}
                                <div className="flex justify-between text-sm">
                                    <span className="text-neutral-500">Delivery fee</span>
                                    <span className="font-medium text-neutral-900 dark:text-white">Rs. 0</span>
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-base">
                                <span className="font-bold text-neutral-900 dark:text-white">Total</span>
                                <span className="font-bold text-primary-600 dark:text-primary-400">Rs. {total}</span>
                            </div>
                        </div>
                    </div>

                    {/* Payment Methods */}
                    <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-3">Payment method</h3>
                        <div className="space-y-3">
                            <label className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${method === "COD" ? "border-primary-500 bg-primary-50 dark:bg-primary-900/10" : "border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"}`}>
                                <input type="radio" name="payment" checked={method === "COD"} onChange={() => setMethod("COD")} className="mr-3 w-4 h-4 accent-primary-600" />
                                <span className="font-medium text-neutral-900 dark:text-white flex-1">Cash on Delivery</span>
                                <span className="text-xl">💵</span>
                            </label>

                            <label className={`flex flex-col border rounded-xl cursor-pointer transition-all ${method === "STRIPE" ? "border-primary-500 bg-primary-50 dark:bg-primary-900/10" : "border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"}`}>
                                <div className="flex items-center p-4">
                                    <input type="radio" name="payment" checked={method === "STRIPE"} onChange={() => setMethod("STRIPE")} className="mr-3 w-4 h-4 accent-primary-600" />
                                    <span className="font-medium text-neutral-900 dark:text-white flex-1">Credit / Debit Card</span>
                                    <span className="text-xl">💳</span>
                                </div>
                                {method === "STRIPE" && (
                                    <div className="p-4 pt-0 space-y-3">
                                        <input type="text" placeholder="Card Number (####-####-####-####)" value={cardNumber} onChange={e => setCardNumber(e.target.value)} className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
                                        <input type="text" placeholder="Cardholder Name" value={cardName} onChange={e => setCardName(e.target.value)} className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
                                        <div className="flex gap-3">
                                            <input type="text" placeholder="MM/YY" value={expiry} onChange={e => setExpiry(e.target.value)} className="w-1/2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
                                            <input type="text" placeholder="CVV" value={cvv} onChange={e => setCvv(e.target.value)} className="w-1/2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
                                        </div>
                                    </div>
                                )}
                            </label>

                            <label className={`flex flex-col border rounded-xl cursor-pointer transition-all ${method === "JAZZCASH" ? "border-primary-500 bg-primary-50 dark:bg-primary-900/10" : "border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"}`}>
                                <div className="flex items-center p-4">
                                    <input type="radio" name="payment" checked={method === "JAZZCASH"} onChange={() => setMethod("JAZZCASH")} className="mr-3 w-4 h-4 accent-primary-600" />
                                    <span className="font-medium text-neutral-900 dark:text-white flex-1">JazzCash</span>
                                    <span className="text-xs font-bold bg-neutral-200 dark:bg-neutral-700 px-2 py-1 rounded text-neutral-600 dark:text-neutral-300">JC</span>
                                </div>
                                {method === "JAZZCASH" && (
                                    <div className="p-4 pt-0">
                                        <input type="tel" placeholder="JazzCash Mobile Number" value={walletPhone} onChange={e => setWalletPhone(e.target.value)} className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
                                    </div>
                                )}
                            </label>

                            <label className={`flex flex-col border rounded-xl cursor-pointer transition-all ${method === "EASYPAISA" ? "border-primary-500 bg-primary-50 dark:bg-primary-900/10" : "border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"}`}>
                                <div className="flex items-center p-4">
                                    <input type="radio" name="payment" checked={method === "EASYPAISA"} onChange={() => setMethod("EASYPAISA")} className="mr-3 w-4 h-4 accent-primary-600" />
                                    <span className="font-medium text-neutral-900 dark:text-white flex-1">Easypaisa</span>
                                    <span className="text-xs font-bold bg-green-200 dark:bg-green-800 px-2 py-1 rounded text-green-700 dark:text-green-300">EP</span>
                                </div>
                                {method === "EASYPAISA" && (
                                    <div className="p-4 pt-0">
                                        <input type="tel" placeholder="Easypaisa Mobile Number" value={walletPhone} onChange={e => setWalletPhone(e.target.value)} className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-2.5 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
                                    </div>
                                )}
                            </label>
                        </div>
                    </div>

                    {error && (
                        <div className="rounded-xl bg-red-50 dark:bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400 border border-red-100 dark:border-red-500/20">
                            {error}
                        </div>
                    )}
                </div>

                <div className="sticky bottom-0 p-5 bg-white dark:bg-neutral-900 border-t border-neutral-100 dark:border-neutral-800">
                    <button
                        onClick={handlePlaceOrder}
                        disabled={isSubmitting}
                        className="w-full min-h-[52px] rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-base transition-colors disabled:opacity-70 flex items-center justify-center shadow-lg shadow-primary-500/20"
                    >
                        {isSubmitting ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            `Place Order — Rs. ${total}`
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
