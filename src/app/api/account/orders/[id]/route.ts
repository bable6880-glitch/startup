import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { db } from "@/lib/db";
import { orders, kitchens, orderItems, meals, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { apiSuccess, apiUnauthorized, apiNotFound, apiInternalError } from "@/lib/utils/api-response";

// GET /api/account/orders/[id]
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getAuthUser(req);
        if (!user) return apiUnauthorized();

        const { id: orderId } = await params;

        // Fetch order — must belong to this customer
        const [order] = await db
            .select({
                id: orders.id,
                status: orders.status,
                totalAmount: orders.totalAmount,
                deliveryMode: orders.deliveryMode,
                notes: orders.notes,
                createdAt: orders.createdAt,
                acceptedAt: orders.acceptedAt,
                completedAt: orders.completedAt,
                cancelledAt: orders.cancelledAt,
                kitchenId: orders.kitchenId,
                kitchenName: kitchens.name,
                kitchenCity: kitchens.city,
                kitchenAddress: kitchens.addressLine,
                kitchenPhone: users.phoneNumber,
            })
            .from(orders)
            .leftJoin(kitchens, eq(orders.kitchenId, kitchens.id))
            .leftJoin(users, eq(kitchens.ownerId, users.id))
            .where(
                and(
                    eq(orders.id, orderId),
                    eq(orders.customerId, user.id) // security: customer can only see their own orders
                )
            )
            .limit(1);

        if (!order) return apiNotFound("Order not found");

        // Fetch order items
        const itemRows = await db
            .select({
                quantity: orderItems.quantity,
                price: orderItems.priceAtOrder,
                mealName: meals.name,
                mealImage: meals.imageUrl,
            })
            .from(orderItems)
            .leftJoin(meals, eq(orderItems.mealId, meals.id))
            .where(eq(orderItems.orderId, orderId));

        return apiSuccess({
            id: order.id,
            status: order.status,
            totalAmount: Number(order.totalAmount),
            deliveryMode: order.deliveryMode,
            notes: order.notes,
            createdAt: order.createdAt,
            acceptedAt: order.acceptedAt,
            completedAt: order.completedAt,
            cancelledAt: order.cancelledAt,
            kitchen: {
                id: order.kitchenId,
                name: order.kitchenName ?? "Kitchen",
                city: order.kitchenCity ?? "",
                address: order.kitchenAddress ?? "",
                phoneNumber: order.kitchenPhone ?? "",
            },
            items: itemRows.map((i) => ({
                quantity: i.quantity,
                price: Number(i.price),
                meal: {
                    name: i.mealName ?? "Item",
                    imageUrl: i.mealImage ?? null,
                },
            })),
        });
    } catch (err) {
        console.error("[GET /api/account/orders/[id]]", err);
        return apiInternalError();
    }
}