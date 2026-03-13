import { db } from "@/lib/db";
import { orders, orderItems, meals, kitchens, users } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import type { CreateOrderInput, UpdateOrderStatusInput } from "@/lib/validations/order";
import { NotFoundError, AuthorizationError, ValidationError } from "@/lib/utils/errors";
import { publishEvent, CHANNELS } from "@/lib/redis/pubsub";
import { sanitizeText } from "@/lib/utils/sanitize";

// ─── Create Order ───────────────────────────────────────────────────────────

export async function createOrder(customerId: string, input: CreateOrderInput) {
    // 0. Fetch customer contact & location details for snapshot
    const customer = await db.query.users.findFirst({
        where: eq(users.id, customerId),
        columns: { name: true, phone: true, defaultAddress: true },
    });
    if (!customer) throw new NotFoundError("Customer");

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

    // 2. Calculate total amount and check availability
    let totalAmount = 0;
    for (const item of input.items) {
        const meal = mealRecords.find((m) => m.id === item.mealId);
        if (!meal) throw new ValidationError(`Meal not found: ${item.mealId}`);
        if (!meal.isAvailable) throw new ValidationError(`Meal is currently unavailable: ${meal.name}`);
        totalAmount += meal.price * item.quantity;
    }

    const sanitizedNotes = input.notes ? sanitizeText(input.notes) : input.notes;

    // 3. Create order
    const [order] = await db
        .insert(orders)
        .values({
            kitchenId: input.kitchenId,
            customerId,
            status: "PENDING",
            notes: sanitizedNotes,
            totalAmount,
            currency: mealRecords[0]?.currency ?? "PKR",
            // Snapshot of customer details at time of order
            customerName: customer.name,
            customerPhone: customer.phone,
            deliveryAddress: customer.defaultAddress,
        })
        .returning();

    // 4. Create order items (Atomic approximation via compensation)
    try {
        await db.insert(orderItems).values(
            input.items.map((item) => {
                const meal = mealRecords.find((m) => m.id === item.mealId)!;
                return {
                    orderId: order.id,
                    mealId: item.mealId,
                    quantity: item.quantity,
                    priceAtOrder: meal.price,
                    notes: item.notes,
                };
            })
        );
    } catch {
        // Compensation: delete the orphaned order if item insertion fails
        await db.delete(orders).where(eq(orders.id, order.id));
        throw new Error("Failed to create order items. Order creation rolled back.");
    }

    // ── 5. Real-time: notify cook dashboard ────────────────────────────────
    try {
        await publishEvent(CHANNELS.kitchenOrders(input.kitchenId), {
            type: "NEW_ORDER",
            payload: {
                orderId: order.id,
                items: input.items.map((item) => {
                    const meal = mealRecords.find((m) => m.id === item.mealId)!;
                    return {
                        mealId: item.mealId,
                        quantity: item.quantity,
                        price: meal.price,
                    };
                }),
                totalAmount: order.totalAmount,
                currency: order.currency,
                notes: order.notes ?? "",
                status: "PENDING",
                placedAt: new Date().toISOString(),
                // Send the snapshotted contact details to the UI live
                customerName: customer.name,
                customerPhone: customer.phone,
                deliveryAddress: customer.defaultAddress,
            },
        });
    } catch { /* Non-critical — don't fail the order if Redis is down */ }

    // ── 6. Return order with kitchen contact info ───────────────────────────
    return {
        ...order,
        items: input.items.map((item) => {
            const meal = mealRecords.find((m) => m.id === item.mealId)!;
            return {
                mealId: item.mealId,
                quantity: item.quantity,
                price: meal.price,
                notes: item.notes,
            };
        }),
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
            kitchen: { columns: { id: true, ownerId: true, name: true } },
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

    // ── Real-time: notify customer of status change ─────────────────────────
    try {
        await publishEvent(CHANNELS.customerOrders(order.customerId), {
            type: "ORDER_STATUS_CHANGED",
            payload: {
                orderId: order.id,
                newStatus: input.status,
                kitchenName: order.kitchen.name ?? "",
                updatedAt: now.toISOString(),
            },
        });
    } catch { /* Non-critical */ }

    // ── Real-time: also notify kitchen to sync UI ───────────────────────────
    try {
        await publishEvent(CHANNELS.kitchenOrders(order.kitchenId), {
            type: "ORDER_STATUS_CHANGED",
            payload: {
                orderId: order.id,
                newStatus: input.status,
                updatedAt: now.toISOString(),
            },
        });
    } catch { /* Non-critical */ }

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