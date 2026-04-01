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

export type AddItemResult = { ok: true } | { ok: false; error: "MIXED_KITCHEN" | "OUT_OF_STOCK" };

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
     * Returns `{ ok: false, error: "MIXED_KITCHEN" }` if the item is from a
     * different kitchen than the current cart contents. The caller must check
     * the result and offer the user a clear-cart confirmation dialog.
     */
    addItem: (kitchenId: string, kitchenName: string, item: Omit<CartItem, "quantity">) => AddItemResult;
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
    // To avoid hydration mismatch while still being SSR-safe, we initialize to EMPTY_CART
    // on the server, and then sync from localStorage on the client in the first pass
    const [cart, setCart] = useState<CartState>(EMPTY_CART);
    const [hydrated, setHydrated] = useState(false);

    // SSR-safe hydration: only touch localStorage after mount
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCart(readFromStorage());
        setHydrated(true);
    }, []);

    // Persist every cart change
    useEffect(() => {
        if (hydrated) {
            writeToStorage(cart);
        }
    }, [cart, hydrated]);

    // ── Mutating functions ────────────────────────────────────────────────────

    const addItem = useCallback(
        (kitchenId: string, kitchenName: string, item: Omit<CartItem, "quantity">): AddItemResult => {
            // Mixed-kitchen guard — check BEFORE setState (Rule #2: never throw inside setState)
            // We read cart via ref-style closure; setCart hasn't been called yet.
            let mixedKitchen = false;
            setCart((prev) => {
                if (prev.kitchenId && prev.kitchenId !== kitchenId && prev.items.length > 0) {
                    mixedKitchen = true;
                    return prev; // no-op, return unchanged state
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

            if (mixedKitchen) return { ok: false, error: "MIXED_KITCHEN" };
            return { ok: true };
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
