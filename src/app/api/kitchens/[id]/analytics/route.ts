import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { orders, orderItems, meals, users, kitchens } from "@/lib/db/schema";
import { eq, and, gte, sql, desc } from "drizzle-orm";
import { apiUnauthorized, apiForbidden, apiNotFound, apiInternalError } from "@/lib/utils/api-response";
import { requireSeller } from "@/lib/auth/seller-guard";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: kitchenId } = await params;

        // Verify ownership
        const guard = await requireSeller(req, kitchenId);
        if (!guard.ok) return guard.response;

        // Current month boundaries
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        // ── Top 2 Buyers This Month ──
        const topBuyers = await db
            .select({
                customerId: orders.customerId,
                customerName: users.name,
                customerAvatar: users.avatarUrl,
                totalSpent: sql<number>`COALESCE(SUM(${orders.totalAmount}), 0)`.as("total_spent"),
                orderCount: sql<number>`COUNT(${orders.id})`.as("order_count"),
            })
            .from(orders)
            .innerJoin(users, eq(orders.customerId, users.id))
            .where(
                and(
                    eq(orders.kitchenId, kitchenId),
                    gte(orders.createdAt, monthStart)
                )
            )
            .groupBy(orders.customerId, users.name, users.avatarUrl)
            .orderBy(desc(sql`total_spent`))
            .limit(2);

        // ── Top Selling Food This Month ──
        const topFood = await db
            .select({
                mealId: orderItems.mealId,
                mealName: meals.name,
                mealImage: meals.imageUrl,
                totalQuantity: sql<number>`COALESCE(SUM(${orderItems.quantity}), 0)`.as("total_qty"),
                totalRevenue: sql<number>`COALESCE(SUM(${orderItems.quantity} * ${orderItems.priceAtOrder}), 0)`.as("total_revenue"),
            })
            .from(orderItems)
            .innerJoin(orders, eq(orderItems.orderId, orders.id))
            .innerJoin(meals, eq(orderItems.mealId, meals.id))
            .where(
                and(
                    eq(orders.kitchenId, kitchenId),
                    gte(orders.createdAt, monthStart)
                )
            )
            .groupBy(orderItems.mealId, meals.name, meals.imageUrl)
            .orderBy(desc(sql`total_qty`))
            .limit(5);

        return NextResponse.json({
            success: true,
            data: {
                month: now.toLocaleString("default", { month: "long", year: "numeric" }),
                topBuyers,
                topFood,
            },
        });
    } catch (error) {
        console.error("Analytics error:", error);
        return apiInternalError();
    }
}
