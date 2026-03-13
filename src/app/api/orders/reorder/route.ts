import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { orders, orderItems, meals } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { apiSuccess, apiUnauthorized, apiInternalError, apiNotFound, apiBadRequest } from "@/lib/utils/api-response";
import { z } from "zod";

const reorderSchema = z.object({
    orderId: z.string().uuid("Invalid order ID format"),
});

export async function POST(request: NextRequest) {
    try {
        const user = await getAuthUser(request);
        if (!user) return apiUnauthorized();

        const body = await request.json().catch(() => ({}));
        const { orderId } = reorderSchema.parse(body);

        // Fetch old order and items
        const oldOrder = await db.query.orders.findFirst({
            where: eq(orders.id, orderId),
            with: {
                items: true,
            },
        });

        if (!oldOrder || oldOrder.customerId !== user.id) {
            return apiNotFound("Original order not found");
        }

        // Check if meals are still available and fetch current prices
        const mealIds = oldOrder.items.map((i) => i.mealId);
        const currentMeals = await db.query.meals.findMany({
            where: inArray(meals.id, mealIds),
            columns: { id: true, price: true, availabilityStatus: true },
        });

        const currentMealsMap = new Map(currentMeals.map((m) => [m.id, m]));

        // Construct new items list and recalculate amount
        const newItems = [];
        let totalAmount = 0;

        for (const item of oldOrder.items) {
            const currentMeal = currentMealsMap.get(item.mealId);
            
            // Reorder only currently available meals
            if (currentMeal && currentMeal.availabilityStatus === "AVAILABLE") {
                const currentPrice = currentMeal.price;
                const itemTotal = Number(currentPrice) * item.quantity;
                totalAmount += itemTotal;

                newItems.push({
                    mealId: item.mealId,
                    quantity: item.quantity,
                    priceAtOrder: currentPrice, // Re-price with current price
                });
            }
        }

        if (newItems.length === 0) {
            return apiBadRequest("None of the items from this order are currently available.");
        }

        // Insert new order and items
        // NOTE: Neon HTTP driver doesn't support interactive transactions (db.transaction)
        // We do sequential inserts. If the second fails, the first is orphaned (unfortunate but known limitation).
        const [newOrder] = await db.insert(orders).values({
            customerId: user.id,
            kitchenId: oldOrder.kitchenId,
            customerName: user.name || "Customer",
            deliveryAddress: oldOrder.deliveryAddress,
            totalAmount,
            status: "PENDING",
            notes: "Reorder",
        }).returning();

        await db.insert(orderItems).values(
            newItems.map((item) => ({
                orderId: newOrder.id,
                ...item,
            }))
        );

        return apiSuccess({ orderId: newOrder.id, message: "Reorder placed successfully" }, 201);
    } catch (error) {
        if (error instanceof z.ZodError) return apiBadRequest("Validation error", error.flatten().fieldErrors);
        console.error("POST /api/orders/reorder error:", error);
        return apiInternalError();
    }
}
