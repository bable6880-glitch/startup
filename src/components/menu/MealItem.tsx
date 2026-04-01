"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/firebase/auth-context";
import { useRouter, usePathname } from "next/navigation";

type MealData = {
    id: string;
    name: string;
    description: string | null;
    price: number;
    category: string | null;
    isAvailable: boolean;
    imageUrl: string | null;
    dietaryTags: string[] | null;
    // U4b: Nutrition fields
    calories: number | null;
    servingSize: string | null;
};

export function MealItem({ meal, kitchenId, kitchenName }: { meal: MealData; kitchenId: string; kitchenName: string }) {
    const { addItem, items, updateQuantity, clearCart, kitchenName: currentKitchenName } = useCart();
    const { user } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const isCook = user?.role === "COOK" || user?.role === "ADMIN";

    // Mixed-kitchen dialog state
    const [showClearDialog, setShowClearDialog] = useState(false);
    const [pendingAdd, setPendingAdd] = useState<{ kitchenId: string; kitchenName: string; item: Omit<import("@/lib/cart-context").CartItem, "quantity"> } | null>(null);

    const cartItem = items.find((i) => i.mealId === meal.id);
    const quantity = cartItem?.quantity || 0;

    const handleAdd = () => {
        if (!user) {
            router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
            return;
        }

        const result = addItem(kitchenId, kitchenName, {
            mealId: meal.id,
            name: meal.name,
            price: meal.price,
            imageUrl: meal.imageUrl,
        });

        if (!result.ok && result.error === "MIXED_KITCHEN") {
            // Save what the user wanted to add, then prompt for clear
            setPendingAdd({
                kitchenId,
                kitchenName,
                item: { mealId: meal.id, name: meal.name, price: meal.price, imageUrl: meal.imageUrl },
            });
            setShowClearDialog(true);
        }
    };

    const handleConfirmClear = () => {
        if (!pendingAdd) return;
        clearCart();
        addItem(pendingAdd.kitchenId, pendingAdd.kitchenName, pendingAdd.item);
        setPendingAdd(null);
        setShowClearDialog(false);
    };

    return (
        <>
            {/* Mixed-kitchen confirmation dialog */}
            {showClearDialog && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowClearDialog(false)}>
                    <div
                        className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-neutral-800"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-50">Start a new cart?</h2>
                        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                            Your cart has items from <span className="font-semibold text-neutral-700 dark:text-neutral-300">{currentKitchenName}</span>. Adding from this kitchen will clear your current cart.
                        </p>
                        <div className="mt-5 flex gap-3">
                            <button
                                onClick={() => setShowClearDialog(false)}
                                className="flex-1 rounded-xl border border-neutral-200 py-2 text-sm font-semibold text-neutral-600 hover:bg-neutral-50 transition-all dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-700"
                            >
                                Keep current
                            </button>
                            <button
                                onClick={handleConfirmClear}
                                className="flex-1 rounded-xl bg-primary-500 py-2 text-sm font-semibold text-white hover:bg-primary-600 transition-all"
                            >
                                Clear &amp; add
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className={`rounded-xl border p-4 transition-all ${meal.isAvailable
                ? "bg-white border-neutral-200/60 hover:shadow-md dark:bg-neutral-800 dark:border-neutral-700"
                : "bg-neutral-50 border-neutral-200/40 opacity-60 dark:bg-neutral-800/50 dark:border-neutral-700/50"
                }`}>
                <div className="flex gap-4">
                    {meal.imageUrl && (
                        <div className="h-24 w-24 flex-shrink-0 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-700">
                            <img src={meal.imageUrl} alt={meal.name} className="h-full w-full object-cover" loading="lazy" />
                        </div>
                    )}

                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-neutral-900 truncate dark:text-neutral-100">{meal.name}</h3>
                            <span className="flex-shrink-0 font-bold text-primary-600 dark:text-primary-400">
                                Rs. {Number(meal.price).toLocaleString()}
                            </span>
                        </div>

                        {meal.description && (
                            <p className="mt-1 text-sm text-neutral-500 line-clamp-2 dark:text-neutral-400">{meal.description}</p>
                        )}

                        <div className="mt-2 flex flex-wrap gap-1.5">
                            {meal.category && (
                                <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                                    {meal.category}
                                </span>
                            )}
                            {!meal.isAvailable && (
                                <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600 dark:bg-red-900/30 dark:text-red-300">
                                    Unavailable
                                </span>
                            )}
                        </div>

                        {/* U4b: Nutrition info */}
                        {(meal.calories || meal.servingSize) && (
                            <div className="mt-1.5 flex flex-wrap gap-2 text-xs text-neutral-400 dark:text-neutral-500">
                                {meal.calories && (
                                    <span className="flex items-center gap-1">
                                        🔥 {meal.calories} cal
                                    </span>
                                )}
                                {meal.servingSize && (
                                    <span className="flex items-center gap-1">
                                        🍽️ {meal.servingSize}
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Add to Cart Actions — hidden for sellers */}
                        {!isCook && (
                            <div className="mt-3" suppressHydrationWarning>
                                {meal.isAvailable ? (
                                    quantity > 0 ? (
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center rounded-lg border border-primary-200 bg-primary-50 dark:border-primary-800 dark:bg-primary-900/20">
                                                <button
                                                    onClick={() => updateQuantity(meal.id, quantity - 1)}
                                                    className="px-3 py-1 text-sm font-bold text-primary-700 hover:bg-primary-100 transition-colors dark:text-primary-400 dark:hover:bg-primary-900/40"
                                                >
                                                    −
                                                </button>
                                                <span className="w-8 text-center text-sm font-bold text-primary-700 dark:text-primary-400">{quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(meal.id, quantity + 1)}
                                                    className="px-3 py-1 text-sm font-bold text-primary-700 hover:bg-primary-100 transition-colors dark:text-primary-400 dark:hover:bg-primary-900/40"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={handleAdd}
                                            className="rounded-lg bg-white border border-neutral-200 px-4 py-1.5 text-sm font-semibold text-primary-600 shadow-sm hover:bg-primary-50 hover:border-primary-200 transition-all active:scale-95 dark:bg-neutral-800 dark:border-neutral-600 dark:text-primary-400 dark:hover:bg-neutral-700"
                                        >
                                            Add +
                                        </button>
                                    )
                                ) : (
                                    <button disabled className="text-sm text-neutral-400 cursor-not-allowed dark:text-neutral-600">
                                        Out of stock
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
