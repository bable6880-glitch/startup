"use client";

import { useAuth } from "@/lib/firebase/auth-context";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useEffect, useState, use } from "react";
import { MapLazy } from "@/components/map/MapLazy";
import { calculateDistance } from "@/lib/utils/distance";
import Link from "next/link";
import { OrderTracker } from "@/components/orders/OrderTracker";

interface OrderItem {
    id: string;
    mealId: string;
    quantity: number;
    priceAtOrder: number;
    notes: string | null;
    meal: {
        id: string;
        name: string;
        imageUrl: string | null;
    };
}

interface OrderKitchen {
    id: string;
    name: string;
    ownerId: string;
    latitude: string | null;
    longitude: string | null;
}

interface OrderCustomer {
    id: string;
    name: string | null;
    email: string | null;
}

interface OrderDetails {
    id: string;
    status: string;
    totalAmount: number;
    currency: string;
    notes: string | null;
    deliveryMode: string;
    estimatedMinutes: number | null;
    createdAt: string;
    items: OrderItem[];
    customer: OrderCustomer;
    kitchen: OrderKitchen;
    customerLat: string | null;
    customerLng: string | null;
    customerAddress: string | null;
}

export default function OrderDetailsPage(props: { params: Promise<{ id: string }> }) {
    const params = use(props.params);
    const { user, loading: authLoading, getIdToken } = useAuth();
    const router = useRouter();
    const [order, setOrder] = useState<OrderDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchOrder = async () => {
            if (authLoading) return;
            if (!user) {
                router.push(`/login?redirect=/orders/${params.id}`);
                return;
            }

            try {
                const token = await getIdToken();
                const res = await fetch(`/api/orders/${params.id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!res.ok) {
                    if (res.status === 403) throw new Error("You don't have permission to view this order");
                    if (res.status === 404) throw new Error("Order not found");
                    throw new Error("Failed to load order");
                }

                const { data } = await res.json();
                setOrder(data);
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : "Unknown error");
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
        // Removed polling setInterval to use SSE instead!
    }, [user, authLoading, getIdToken, params.id, router]);

    if (loading || authLoading) {
        return (
            <div className="mx-auto max-w-4xl px-4 py-8">
                <div className="animate-pulse space-y-8">
                    <div className="h-8 w-64 bg-neutral-200 rounded" />
                    <div className="h-64 w-full bg-neutral-200 rounded-xl" />
                    <div className="space-y-4">
                        <div className="h-4 w-full bg-neutral-200 rounded" />
                        <div className="h-4 w-3/4 bg-neutral-200 rounded" />
                    </div>
                </div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="mx-auto max-w-4xl px-4 py-16 text-center">
                <span className="text-4xl block mb-4">😕</span>
                <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{error || "Order not found"}</h1>
                <Link href="/explore" className="mt-4 inline-block rounded-lg bg-primary-600 px-4 py-2 text-white font-medium hover:bg-primary-700">
                    Go to Explore
                </Link>
            </div>
        );
    }

    // Map data — use kitchen coords if available, otherwise offset from customer
    const hasKitchenLocation = !!(order.kitchen.latitude && order.kitchen.longitude);
    const kitchenLat = order.kitchen.latitude ? Number(order.kitchen.latitude) : (order.customerLat ? Number(order.customerLat) + 0.01 : 31.5204);
    const kitchenLng = order.kitchen.longitude ? Number(order.kitchen.longitude) : (order.customerLng ? Number(order.customerLng) + 0.01 : 74.3587);

    const hasCustomerLocation = order.customerLat && order.customerLng;
    const distance = hasCustomerLocation
        ? calculateDistance(kitchenLat, kitchenLng, Number(order.customerLat), Number(order.customerLng))
        : null;

    const markers = [
        { position: [kitchenLat, kitchenLng] as [number, number], title: `🍳 ${order.kitchen.name}` },
    ];
    if (hasCustomerLocation) {
        markers.push({
            position: [Number(order.customerLat), Number(order.customerLng)] as [number, number],
            title: "📍 Delivery Location",
        });
    }

    const mapCenter: [number, number] = hasCustomerLocation
        ? [(kitchenLat + Number(order.customerLat)) / 2, (kitchenLng + Number(order.customerLng)) / 2]
        : [kitchenLat, kitchenLng];

    return (
        <div className="mx-auto max-w-4xl px-4 py-8 pb-20">
            {/* Header */}
            <div className="mb-8">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                            Order #{order.id.slice(0, 8)}
                        </h1>
                        <p className="text-neutral-500 dark:text-neutral-400">
                            Placed on {format(new Date(order.createdAt), "PPP p")}
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Live Tracker replaces static blocks */}
                    <OrderTracker 
                        customerId={user?.uid ?? ""} 
                        initialOrder={{
                            id: order.id,
                            status: order.status,
                            estimatedMinutes: order.estimatedMinutes,
                            acceptedAt: (order as any).acceptedAt || order.createdAt,
                            kitchen: { id: order.kitchen.id, name: order.kitchen.name }
                        }}
                    />

                    {/* Map Section */}
                    <div className="rounded-2xl border border-neutral-200 overflow-hidden shadow-sm h-80 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800">
                        {(hasCustomerLocation || hasKitchenLocation) ? (
                            <div className="relative h-full w-full">
                                <MapLazy
                                    center={mapCenter}
                                    zoom={hasCustomerLocation ? 14 : 15}
                                    markers={markers}
                                    route={hasCustomerLocation ? [[kitchenLat, kitchenLng], [Number(order.customerLat), Number(order.customerLng)]] : []}
                                />
                                {distance !== null && (
                                    <div className="absolute top-4 right-4 z-[400] bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg shadow-md text-xs font-bold text-neutral-800">
                                        📏 Distance: {distance} km
                                    </div>
                                )}
                                {!hasCustomerLocation && (
                                    <div className="absolute bottom-4 left-4 z-[400] bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg shadow-md text-xs text-neutral-600">
                                        📍 Kitchen location shown • Customer location not available
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex h-full items-center justify-center text-neutral-400">
                                <div className="text-center">
                                    <span className="text-4xl block mb-2">🗺️</span>
                                    <p>No location data available</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Order Items */}
                    <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:bg-neutral-800 dark:border-neutral-700">
                        <h2 className="font-bold text-lg mb-4 text-neutral-900 dark:text-neutral-100">Order Summary</h2>
                        <div className="space-y-4">
                            {order.items.map((item) => (
                                <div key={item.id} className="flex justify-between items-start">
                                    <div className="flex gap-3">
                                        <span className="font-bold text-neutral-500 w-6">{item.quantity}x</span>
                                        <p className="font-medium text-neutral-900 dark:text-neutral-200">{item.meal.name}</p>
                                    </div>
                                    <p className="font-medium text-neutral-900 dark:text-neutral-200">
                                        Rs. {item.priceAtOrder * item.quantity}
                                    </p>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 pt-6 border-t border-neutral-100 flex justify-between items-center text-lg font-bold dark:border-neutral-700">
                            <span>Total</span>
                            <span>Rs. {order.totalAmount}</span>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:bg-neutral-800 dark:border-neutral-700">
                        <h2 className="font-bold text-sm text-neutral-500 uppercase tracking-wide mb-4 dark:text-neutral-400">Delivery Details</h2>
                        <div className="space-y-4">
                            <div>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">Kitchen</p>
                                <Link href={`/kitchen/${order.kitchen.id}`} className="font-medium text-primary-600 hover:underline">
                                    {order.kitchen.name}
                                </Link>
                            </div>
                            <div>
                                <p className="text-xs text-neutral-500 dark:text-neutral-400">Method</p>
                                <p className="font-medium text-neutral-900 dark:text-neutral-200">
                                    {order.deliveryMode === "SELF_PICKUP" ? "🏃 Self Pickup" : "🛵 Free Delivery"}
                                </p>
                            </div>
                            {order.customerAddress && (
                                <div>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Deliver to</p>
                                    <p className="font-medium text-neutral-900 dark:text-neutral-200">{order.customerAddress}</p>
                                </div>
                            )}
                            {order.notes && (
                                <div>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Notes</p>
                                    <p className="text-sm text-neutral-800 italic bg-yellow-50 p-2 rounded dark:bg-yellow-900/20 dark:text-yellow-200">
                                        &quot;{order.notes}&quot;
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="text-center">
                        <Link
                            href={user?.role === "COOK" ? "/dashboard/orders" : "/explore"}
                            className="text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline"
                        >
                            &larr; Back to {user?.role === "COOK" ? "Dashboard" : "Explore"}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
