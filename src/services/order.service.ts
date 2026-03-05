import { db } from "@/lib/db";
import { orders, orderItems, meals, kitchens } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import type { CreateOrderInput, UpdateOrderStatusInput } from "@/lib/validations/order";
import { NotFoundError, AuthorizationError, ValidationError } from "@/lib/utils/errors";
import { collectAndPublishEvent, RealtimeChannels } from "@/lib/redis/pubsub";

// ─── Create Order ───────────────────────────────────────────────────────────

export async function createOrder(customerId: string, input: CreateOrderInput) {
    // 1. Verify kitchen is active
    const kitchen = await db.query.kitchens.findFirst({
        where: eq(kitchens.id, input.kitchenId),
        columns: { id: true, status: true, contactPhone: true, contactWhatsapp: true },
    });

    if (!kitchen) throw new NotFoundError("Kitchen");
    if (kitchen.status !== "ACTIVE") {
        throw new ValidationError("Kitchen is not currently accepting orders");
    }

    // 2. Fetch meals and validate
    const mealRecords = await db.query.meals.findMany({
        where: and(eq(meals.kitchenId, input.kitchenId)),
    });

    const mealMap = new Map(mealRecords.map((m) => [m.id, m]));
    let totalAmount = 0;

    for (const item of input.items) {
        const meal = mealMap.get(item.mealId);
        if (!meal) throw new NotFoundError(`Meal ${item.mealId}`);
        if (!meal.isAvailable) {
            throw new ValidationError(`${meal.name} is not available`);
        }
        totalAmount += meal.price * item.quantity;
    }

    // 3. Create order
    const [order] = await db
        .insert(orders)
        .values({
            kitchenId: input.kitchenId,
            customerId,
            status: "PENDING",
            notes: input.notes,
            totalAmount,
            currency: mealRecords[0]?.currency ?? "INR",
        })
        .returning();

    // 4. Create order items
    const itemValues = input.items.map((item) => ({
        orderId: order.id,
        mealId: item.mealId,
        quantity: item.quantity,
        priceAtOrder: mealMap.get(item.mealId)!.price,
        notes: item.notes,
    }));

    await db.insert(orderItems).values(itemValues);

    // ── 5. Real-time Notification ───────────────────────────────────────────
    await collectAndPublishEvent(RealtimeChannels.kitchen(input.kitchenId), {
        type: "NEW_ORDER",
        payload: { orderId: order.id, ...order, items: itemValues },
    });

    // ── 6. Return order with kitchen contact info ───────────────────────────
    return {
        ...order,
        items: itemValues,
        kitchenContact: {
            phone: kitchen.contactPhone,
            whatsapp: kitchen.contactWhatsapp,
        },
    };
}

// ─── Get Customer Orders ────────────────────────────────────────────────────

export async function getCustomerOrders(customerId: string) {
    return db.query.orders.findMany({
        where: eq(orders.customerId, customerId),
        orderBy: [desc(orders.createdAt)],
        with: {
            kitchen: {
                columns: { id: true, name: true, slug: true, profileImageUrl: true },
            },
            items: {
                with: {
                    meal: {
                        columns: { id: true, name: true, price: true, imageUrl: true },
                    },
                },
            },
        },
    });
}

// ─── Get Order by ID ────────────────────────────────────────────────────────

export async function getOrderById(orderId: string, userId: string) {
    const order = await db.query.orders.findFirst({
        where: eq(orders.id, orderId),
        with: {
            kitchen: {
                columns: {
                    id: true,
                    name: true,
                    slug: true,
                    contactPhone: true,
                    contactWhatsapp: true,
                    profileImageUrl: true,
                },
            },
            items: {
                with: {
                    meal: true,
                },
            },
        },
    });

    if (!order) throw new NotFoundError("Order");

    // Only customer or kitchen owner can view
    if (order.customerId !== userId && order.kitchen.id !== userId) {
        throw new AuthorizationError("Not authorized to view this order");
    }

    return order;
}

// ─── Update Order Status (Cook only) ────────────────────────────────────────

export async function updateOrderStatus(
    orderId: string,
    userId: string,
    input: UpdateOrderStatusInput
) {
    const order = await db.query.orders.findFirst({
        where: eq(orders.id, orderId),
        with: {
            kitchen: { columns: { id: true, ownerId: true } },
        },
    });

    if (!order) throw new NotFoundError("Order");
    if (order.kitchen.ownerId !== userId) {
        throw new AuthorizationError("Only the kitchen owner can update order status");
    }

    const now = new Date();
    const updateData: Record<string, unknown> = {
        status: input.status,
        updatedAt: now,
    };

    if (input.status === "ACCEPTED") updateData.acceptedAt = now;
    if (input.status === "COMPLETED") updateData.completedAt = now;
    if (input.status === "CANCELLED") updateData.cancelledAt = now;

    const [updated] = await db
        .update(orders)
        .set(updateData)
        .where(eq(orders.id, orderId))
        .returning();

    // ── Real-time Status Update ─────────────────────────────────────────────
    // Notify customer
    await collectAndPublishEvent(RealtimeChannels.customer(order.customerId), {
        type: "ORDER_STATUS",
        payload: { orderId, status: input.status },
    });

    // Also notify kitchen (to sync UI)
    await collectAndPublishEvent(RealtimeChannels.kitchen(order.kitchenId), {
        type: "ORDER_STATUS",
        payload: { orderId, status: input.status },
    });

    return updated;
}

// ─── Get Kitchen Orders (for Cook) ──────────────────────────────────────────

export async function getKitchenOrders(kitchenId: string, ownerId: string) {
    // Verify ownership
    const kitchen = await db.query.kitchens.findFirst({
        where: eq(kitchens.id, kitchenId),
        columns: { id: true, ownerId: true },
    });

    if (!kitchen) throw new NotFoundError("Kitchen");
    if (kitchen.ownerId !== ownerId) {
        throw new AuthorizationError("You don't own this kitchen");
    }

    return db.query.orders.findMany({
        where: eq(orders.kitchenId, kitchenId),
        orderBy: [desc(orders.createdAt)],
        with: {
            customer: {
                columns: { id: true, name: true, phone: true },
            },
            items: {
                with: {
                    meal: {
                        columns: { id: true, name: true, price: true },
                    },
                },
            },
        },
    });
}
