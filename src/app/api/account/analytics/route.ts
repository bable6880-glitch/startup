import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { orders, reviews, kitchens } from "@/lib/db/schema";
import { eq, count, sum, desc } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { apiSuccess, apiUnauthorized, apiInternalError } from "@/lib/utils/api-response";

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthUser(request);
        if (!user) return apiUnauthorized();

        // 1. Total Orders & Spent
        const orderStats = await db
            .select({
                totalOrders: count(orders.id),
                totalSpent: sum(orders.totalAmount),
            })
            .from(orders)
            .where(eq(orders.customerId, user.id));

        // 2. Total Reviews
        const [{ value: totalReviews }] = await db
            .select({ value: count(reviews.id) })
            .from(reviews)
            .where(eq(reviews.userId, user.id));

        // 3. Kitchens Tried (Distinct kitchens from orders)
        // Using distinct count in Raw SQL or just grouping
        const kitchensTriedResult = await db
            .select({ kitchenId: orders.kitchenId })
            .from(orders)
            .where(eq(orders.customerId, user.id))
            .groupBy(orders.kitchenId);

        const kitchensTried = kitchensTriedResult.length;

        // 4. Monthly Spending (Raw grouping by month)
        // In Drizzle we can map in JS since one user rarely has > 10,000 orders
        const allUserOrders = await db.query.orders.findMany({
            where: eq(orders.customerId, user.id),
            columns: { totalAmount: true, createdAt: true },
        });

        const monthlyMap = new Map<string, number>();
        allUserOrders.forEach(o => {
            const date = new Date(o.createdAt);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`; // e.g. 2024-03
            monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + Number(o.totalAmount));
        });
        
        const monthlySpending = Array.from(monthlyMap.entries())
            .map(([month, amount]) => ({ month, amount }))
            .sort((a, b) => a.month.localeCompare(b.month)); // Ascending chronological

        // 5. Top Kitchens (Most ordered from)
        // Drizzle can do a count grouped by kitchen
        const topKitchensResult = await db
            .select({
                kitchenId: orders.kitchenId,
                orderCount: count(orders.id),
            })
            .from(orders)
            .where(eq(orders.customerId, user.id))
            .groupBy(orders.kitchenId)
            .orderBy(desc(count(orders.id)))
            .limit(3);

        const kitchenIds = topKitchensResult.map(tk => tk.kitchenId).filter(Boolean) as string[];
        let topKitchensWithNames: Array<{name: string, orders: number}> = [];
        
        if (kitchenIds.length > 0) {
            const kitchensData = await db.query.kitchens.findMany({
                where: (k, { inArray }) => inArray(k.id, kitchenIds),
                columns: { id: true, name: true }
            });
            const kMap = new Map(kitchensData.map(k => [k.id, k.name]));
            topKitchensWithNames = topKitchensResult.map(tk => ({
                name: String(kMap.get(tk.kitchenId!) || "Kitchen"),
                orders: Number(tk.orderCount)
            }));
        }

        return apiSuccess({
            totalOrders: Number(orderStats[0]?.totalOrders || 0),
            totalSpent: Number(orderStats[0]?.totalSpent || 0),
            totalReviews: Number(totalReviews || 0),
            kitchensTried,
            topKitchens: topKitchensWithNames,
            monthlySpending,
        });

    } catch (error) {
        console.error("GET /api/account/analytics error:", error);
        return apiInternalError();
    }
}
