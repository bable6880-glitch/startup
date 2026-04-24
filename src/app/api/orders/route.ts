import { NextRequest } from "next/server";
import { apiSuccess, apiUnauthorized, apiBadRequest, apiInternalError } from "@/lib/utils/api-response";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { db } from "@/lib/db";
import { orders, orderItems, meals, kitchens } from "@/lib/db/schema";
import { createOrderSchema } from "@/lib/validations/order";
import { eq, inArray, desc } from "drizzle-orm";
import { sanitizeText } from "@/lib/utils/sanitize";

/**
 * GET /api/orders
 * Auth required: Get the current user's orders (as customer) or kitchen orders (as cook).
 */
export async function GET(request: NextRequest) {
    try {
        const user = await getAuthUser(request);
        if (!user) return apiUnauthorized();

        const { searchParams } = new URL(request.url);
        const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));
        const offset = (page - 1) * limit;

        const isCook = user.role === "COOK" || user.role === "ADMIN";

        if (isCook) {
            // Get orders for the cook's kitchen(s)
            const userKitchens = await db.query.kitchens.findMany({
                where: eq(kitchens.ownerId, user.id),
                columns: { id: true },
            });

            if (userKitchens.length === 0) return apiSuccess([]);

            const kitchenIds = userKitchens.map((k) => k.id);
            const kitchenOrders = await db.query.orders.findMany({
                where: inArray(orders.kitchenId, kitchenIds),
                orderBy: [desc(orders.createdAt)],
                with: {
                    customer: { columns: { id: true, name: true, avatarUrl: true } },
                    items: {
                        with: { meal: { columns: { id: true, name: true } } },
                    },
                },
                limit,
                offset,
            });

            return apiSuccess(kitchenOrders);
        } else {
            // Customer: get their own orders
            const customerOrders = await db.query.orders.findMany({
                where: eq(orders.customerId, user.id),
                orderBy: [desc(orders.createdAt)],
                with: {
                    kitchen: { columns: { id: true, name: true } },
                    items: {
                        with: { meal: { columns: { id: true, name: true } } },
                    },
                },
                limit,
                offset,
            });

            return apiSuccess(customerOrders);
        }
    } catch (error) {
        console.error("[Fetch Orders Error]", error);
        return apiInternalError("Failed to fetch orders");
    }
}

/**
 * POST /api/orders
 * Auth required: Place a new order.
 */
export async function POST(request: NextRequest) {
    try {
        const user = await getAuthUser(request);
        if (!user) {
            return apiUnauthorized();
        }

        const body = await request.json();
        const parsed = createOrderSchema.safeParse(body);

        if (!parsed.success) {
            console.error("[Order Validation Error]", parsed.error.flatten());
            return apiBadRequest("Invalid order data", parsed.error.flatten().fieldErrors);
        }

        const { kitchenId, items, notes, customerAddress, customerLat, customerLng } = parsed.data;

        // Verify valid coordinates
        let validLat = customerLat;
        let validLng = customerLng;
        if (customerLat !== undefined && customerLat !== null) {
            const numLat = Number(customerLat);
            if (isNaN(numLat) || numLat < -90 || numLat > 90) validLat = undefined;
        }
        if (customerLng !== undefined && customerLng !== null) {
            const numLng = Number(customerLng);
            if (isNaN(numLng) || numLng < -180 || numLng > 180) validLng = undefined;
        }

        // Log to structured logger
        if (validLat !== undefined && validLng !== undefined) {
            console.log(JSON.stringify({
                event: 'ORDER_LOCATION',
                userId: user.id,
                lat: validLat,
                lng: validLng,
                timestamp: new Date().toISOString()
            }));
        }

        // Verify kitchen exists and is active
        const kitchen = await db.query.kitchens.findFirst({
            where: eq(kitchens.id, kitchenId),
        });

        if (!kitchen || kitchen.status !== "ACTIVE") {
            return apiBadRequest("Kitchen not found or unavailable");
        }

        // CHANGED [H2]: Check subscription status — kitchen must have active subscription
        const { getSubscriptionStatus } = await import("@/services/premium.service");
        const subStatus = await getSubscriptionStatus(kitchenId);
        if (!subStatus.canAcceptOrders) {
            return apiBadRequest(
                "This kitchen's subscription is not active. The cook needs to renew to accept orders."
            );
        }

        // Auto-resolve delivery mode from kitchen's configured options
        let deliveryMode: "SELF_PICKUP" | "FREE_DELIVERY" = "SELF_PICKUP";
        const kitchenOptions = kitchen.deliveryOptions || ["SELF_PICKUP"];
        if (kitchenOptions.includes("FREE_DELIVERY")) {
            deliveryMode = "FREE_DELIVERY";
        } else {
            deliveryMode = (kitchenOptions[0] as "SELF_PICKUP" | "FREE_DELIVERY") || "SELF_PICKUP";
        }

        // Override with client-provided value if valid
        if (parsed.data.deliveryMode && kitchenOptions.includes(parsed.data.deliveryMode)) {
            deliveryMode = parsed.data.deliveryMode;
        }

        // Verify items and calculate total
        const mealIds = items.map((i) => i.mealId);
        const mealRecords = await db.query.meals.findMany({
            where: inArray(meals.id, mealIds),
        });

        if (mealRecords.length !== items.length) {
            return apiBadRequest("One or more items not found");
        }

        let totalAmount = 0;
        const prepareItems = items.map((item) => {
            const meal = mealRecords.find((m) => m.id === item.mealId);
            if (!meal) throw new Error(`Meal ${item.mealId} not found`);

            // Check availability
            if (!meal.isAvailable) {
                throw new Error(`Meal "${meal.name}" is currently unavailable`);
            }

            const itemTotal = Number(meal.price) * item.quantity;
            totalAmount += itemTotal;

            return {
                mealId: item.mealId,
                quantity: item.quantity,
                price: Number(meal.price),
                notes: item.notes ? sanitizeText(item.notes) : null,
            };
        });

        // Ensure totalAmount is an integer (smallest currency unit)
        totalAmount = Math.round(totalAmount);

        // Create Order (sequential inserts — neon-http does not support transactions)
        const [newOrder] = await db
            .insert(orders)
            .values({
                kitchenId,
                customerId: user.id,
                status: "PENDING",
                totalAmount,
                currency: "PKR",
                notes: notes ? sanitizeText(notes) : null,
                deliveryMode,
                customerAddress,
                // Location data intentionally not stored in orders table
            })
            .returning();

        for (const item of prepareItems) {
            await db.insert(orderItems).values({
                orderId: newOrder.id,
                mealId: item.mealId,
                quantity: item.quantity,
                priceAtOrder: item.price,
                notes: item.notes,
            });
        }

        // N2: Send notification to the cook
        const { notifyOrderPlaced } = await import("@/services/notification.service");
        await notifyOrderPlaced(kitchen.ownerId, newOrder.id, user.name || "A customer");

        // PHASE 2: Publish SSE event for new order
        const { publishEvent, CHANNELS } = await import("@/lib/redis/pubsub");
        await publishEvent(CHANNELS.kitchenOrders(kitchen.id), {
            type: "NEW_ORDER",
            payload: {
                orderId: newOrder.id,
                customerName: user.name ?? "Customer",
                itemCount: items.length,
                totalAmount: Number(totalAmount),
                createdAt: new Date().toISOString(),
            }
        });

        // N3: Invalidate buyer analytics cache
        const { invalidateCache } = await import("@/lib/redis");
        await invalidateCache(`account:analytics:${user.id}`);

        return apiSuccess(newOrder);

    } catch (error: unknown) {
        if (error instanceof Error && error.message?.includes("is currently unavailable")) {
            return apiBadRequest(error.message);
        }
        console.error("[Create Order Error]", error);
        return apiInternalError("Failed to place order");
    }
}
