"use client";

import {
    createContext,
    useContext,
    useState,
    useCallback,
    useEffect,
    useMemo,
    type ReactNode,
} from "react";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface CartItem {
    mealId: string;
    name: string;
    price: number;
    imageUrl: string | null;
    quantity: number;
}

export interface CartState {
    kitchenId: string | null;
    kitchenName: string | null;
    items: CartItem[];
}

interface CartContextType extends CartState {
    /** Hydration complete — false during SSR / before useEffect runs */
    hydrated: boolean;
    /**
     * Add an item to the cart.
     * Throws `Error("MIXED_KITCHEN")` if the item is from a different kitchen
     * than the current cart contents. The caller is responsible for catching
     * this and offering the user a clear-cart confirmation dialog.
     */
    addItem: (kitchenId: string, kitchenName: string, item: Omit<CartItem, "quantity">) => void;
    removeItem: (mealId: string) => void;
    updateQuantity: (mealId: string, quantity: number) => void;
    clearCart: () => void;
    /** Total price in PKR */
    totalAmount: number;
    /** Alias kept for consumers that still use `total` */
    total: number;
    itemCount: number;
}

// ─── Storage ─────────────────────────────────────────────────────────────────

const CART_KEY = "smart-tiffin-cart-v1";

const EMPTY_CART: CartState = { kitchenId: null, kitchenName: null, items: [] };

function readFromStorage(): CartState {
    try {
        const raw = localStorage.getItem(CART_KEY);
        if (raw) {
            const parsed = JSON.parse(raw) as Partial<CartState>;
            // Basic shape validation
            if (Array.isArray(parsed.items)) return parsed as CartState;
        }
    } catch {
        /* ignore storage errors */
    }
    return EMPTY_CART;
}

function writeToStorage(state: CartState) {
    try {
        localStorage.setItem(CART_KEY, JSON.stringify(state));
    } catch {
        /* ignore quota/security errors */
    }
}

// ─── Context ─────────────────────────────────────────────────────────────────

const CartContext = createContext<CartContextType | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export function CartProvider({ children }: { children: ReactNode }) {
    // Start with empty cart on the server — hydrate from localStorage in effect
    const [cart, setCart] = useState<CartState>(EMPTY_CART);
    const [hydrated, setHydrated] = useState(false);

    // SSR-safe hydration: only touch localStorage after mount
    useEffect(() => {
        setCart(readFromStorage());
        setHydrated(true);
    }, []);

    // Persist every cart change (after hydration to avoid overwriting with empty)
    useEffect(() => {
        if (hydrated) {
            writeToStorage(cart);
        }
    }, [cart, hydrated]);

    // ── Mutating functions ────────────────────────────────────────────────────

    const addItem = useCallback(
        (kitchenId: string, kitchenName: string, item: Omit<CartItem, "quantity">) => {
            setCart((prev) => {
                // Mixed-kitchen guard — throw so the caller can show a dialog
                if (prev.kitchenId && prev.kitchenId !== kitchenId && prev.items.length > 0) {
                    throw new Error("MIXED_KITCHEN");
                }

                const existing = prev.items.find((i) => i.mealId === item.mealId);
                if (existing) {
                    return {
                        ...prev,
                        kitchenId,
                        kitchenName,
                        items: prev.items.map((i) =>
                            i.mealId === item.mealId ? { ...i, quantity: i.quantity + 1 } : i
                        ),
                    };
                }

                return {
                    ...prev,
                    kitchenId,
                    kitchenName,
                    items: [...prev.items, { ...item, quantity: 1 }],
                };
            });
        },
        []
    );

    const removeItem = useCallback((mealId: string) => {
        setCart((prev) => {
            const newItems = prev.items.filter((i) => i.mealId !== mealId);
            if (newItems.length === 0) return EMPTY_CART;
            return { ...prev, items: newItems };
        });
    }, []);

    const updateQuantity = useCallback((mealId: string, quantity: number) => {
        if (quantity <= 0) {
            setCart((prev) => {
                const newItems = prev.items.filter((i) => i.mealId !== mealId);
                if (newItems.length === 0) return EMPTY_CART;
                return { ...prev, items: newItems };
            });
            return;
        }
        setCart((prev) => ({
            ...prev,
            items: prev.items.map((i) =>
                i.mealId === mealId ? { ...i, quantity: Math.min(quantity, 50) } : i
            ),
        }));
    }, []);

    const clearCart = useCallback(() => {
        setCart(EMPTY_CART);
    }, []);

    // ── Derived values (memoized) ─────────────────────────────────────────────

    const totalAmount = useMemo(
        () => cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
        [cart.items]
    );

    const itemCount = useMemo(
        () => cart.items.reduce((sum, item) => sum + item.quantity, 0),
        [cart.items]
    );

    const value = useMemo<CartContextType>(
        () => ({
            ...cart,
            hydrated,
            addItem,
            removeItem,
            updateQuantity,
            clearCart,
            totalAmount,
            total: totalAmount, // backward-compat alias
            itemCount,
        }),
        [cart, hydrated, addItem, removeItem, updateQuantity, clearCart, totalAmount, itemCount]
    );

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCart() {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error("useCart must be used inside CartProvider");
    return ctx;
}
