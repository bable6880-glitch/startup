import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { db } from "@/lib/db";
import { orders, kitchens, orderItems, meals } from "@/lib/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { apiSuccess, apiUnauthorized, apiInternalError } from "@/lib/utils/api-response";

// GET /api/account/orders?page=1&limit=10
export async function GET(req: NextRequest) {
    try {
        const user = await getAuthUser(req);
        if (!user) return apiUnauthorized();

        const { searchParams } = new URL(req.url);
        const page = Math.max(1, Number(searchParams.get("page") ?? 1));
        const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 10)));
        const offset = (page - 1) * limit;

        // Fetch orders with kitchen name
        const orderRows = await db
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
            })
            .from(orders)
            .leftJoin(kitchens, eq(orders.kitchenId, kitchens.id))
            .where(eq(orders.customerId, user.id))
            .orderBy(desc(orders.createdAt))
            .limit(limit)
            .offset(offset);

        // Count total for pagination
        const [{ total }] = await db
            .select({ total: db.$count(orders, eq(orders.customerId, user.id)) })
            .from(orders)
            .where(eq(orders.customerId, user.id));

        // Fetch items for each order (batch)
        const orderIds = orderRows.map((o) => o.id);
        const itemMap: Record<string, Array<{ quantity: number; price: number; meal?: { name: string } }>> = {};

        if (orderIds.length > 0) {
            const itemRows = await db
                .select({
                    orderId: orderItems.orderId,
                    quantity: orderItems.quantity,
                    price: orderItems.priceAtOrder,
                    mealName: meals.name,
                })
                .from(orderItems)
                .leftJoin(meals, eq(orderItems.mealId, meals.id))
                .where(inArray(orderItems.orderId, orderIds));

            // Group items by orderId
            for (const item of itemRows) {
                if (!itemMap[item.orderId]) itemMap[item.orderId] = [];
                itemMap[item.orderId].push({
                    quantity: item.quantity,
                    price: Number(item.price),
                    meal: { name: item.mealName ?? "Item" },
                });
            }
        }

        const result = orderRows.map((o) => ({
            id: o.id,
            status: o.status,
            totalAmount: Number(o.totalAmount),
            deliveryMode: o.deliveryMode,
            notes: o.notes,
            createdAt: o.createdAt,
            acceptedAt: o.acceptedAt,
            completedAt: o.completedAt,
            cancelledAt: o.cancelledAt,
            kitchen: {
                id: o.kitchenId,
                name: o.kitchenName ?? "Kitchen",
                city: o.kitchenCity ?? "",
            },
            items: itemMap[o.id] ?? [],
        }));

        const totalPages = Math.ceil(Number(total) / limit);

        return apiSuccess({
            orders: result,
            pagination: { page, limit, total: Number(total), totalPages },
        });
    } catch (err) {
        console.error("[GET /api/account/orders]", err);
        return apiInternalError();
    }
}