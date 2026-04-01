import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { orders, reviews } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { cached } from "@/lib/redis";
import { apiSuccess, apiInternalError, apiUnauthorized } from "@/lib/utils/api-response";
import { getAuthUser } from "@/lib/auth/get-auth-user";

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthUser(request);
        if (!user) return apiUnauthorized();

        const cacheKey = `account:analytics:${user.id}`;
        
        const data = await cached(cacheKey, 300, async () => {
            // 1. Fetch Orders for this user
            const userOrders = await db.query.orders.findMany({
                where: eq(orders.customerId, user.id),
                with: {
                    kitchen: { columns: { id: true, name: true } }
                }
            });

            // 2. Fetch User Reviews
            const userReviews = await db.query.reviews.findMany({
                where: eq(reviews.userId, user.id)
            });

            // Calculate Metrics
            const totalOrders = userOrders.length;
            
            let totalSpendPkr = 0;
            const statusBreakdown = { PENDING: 0, ACCEPTED: 0, COMPLETED: 0, CANCELLED: 0 };
            const kitchenCounts: Record<string, { id: string, name: string, count: number }> = {};
            
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
            sixMonthsAgo.setDate(1);
            sixMonthsAgo.setHours(0,0,0,0);

            // Grouping by month
            // We want array of { month: "Jan 2026", count: N, spendPkr: M }
            const monthMap = new Map<string, { count: number, spendPkr: number }>();
            // Initialize last 6 months
            for (let i = 5; i >= 0; i--) {
                const d = new Date();
                d.setMonth(d.getMonth() - i);
                const monthStr = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                monthMap.set(monthStr, { count: 0, spendPkr: 0 });
            }

            for (const order of userOrders) {
                // Status breakdown
                if (statusBreakdown[order.status as keyof typeof statusBreakdown] !== undefined) {
                    statusBreakdown[order.status as keyof typeof statusBreakdown]++;
                }

                // Total spend across COMPLETED orders
                if (order.status === "COMPLETED") {
                    totalSpendPkr += (order.totalAmount || 0);
                }

                // Kitchens tried
                if (order.kitchen) {
                    if (!kitchenCounts[order.kitchen.id]) {
                        kitchenCounts[order.kitchen.id] = { id: order.kitchen.id, name: order.kitchen.name, count: 0 };
                    }
                    kitchenCounts[order.kitchen.id].count++;
                }

                // Groups in-memory — acceptable at user order history scale.
                const orderDate = new Date(order.createdAt);
                if (orderDate >= sixMonthsAgo) {
                    const mStr = orderDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                    if (monthMap.has(mStr)) {
                        const mData = monthMap.get(mStr)!;
                        mData.count++;
                        if (order.status === "COMPLETED") {
                            mData.spendPkr += (order.totalAmount || 0);
                        }
                    } else {
                        monthMap.set(mStr, { 
                            count: 1, 
                            spendPkr: order.status === "COMPLETED" ? (order.totalAmount || 0) : 0 
                        });
                    }
                }
            }

            const averageOrderValuePkr = totalOrders > 0 ? (totalSpendPkr / totalOrders) : 0;
            const kitchensTried = Object.keys(kitchenCounts).length;
            const reviewsGiven = userReviews.length;

            let favoriteKitchen: { id: string, name: string, orderCount: number } | null = null;
            let maxCount = 0;
            for (const k of Object.values(kitchenCounts)) {
                if (k.count > maxCount) {
                    maxCount = k.count;
                    favoriteKitchen = { id: k.id, name: k.name, orderCount: k.count };
                }
            }

            const ordersByMonth = Array.from(monthMap.entries()).map(([month, mapData]) => ({
                month,
                count: mapData.count,
                spendPkr: mapData.spendPkr
            }));

            return {
                totalOrders,
                totalSpendPkr: Math.round(totalSpendPkr),
                averageOrderValuePkr: Math.round(averageOrderValuePkr),
                kitchensTried,
                reviewsGiven,
                favoriteKitchen,
                ordersByMonth,
                statusBreakdown
            };
        });

        return apiSuccess(data);
    } catch (error) {
        console.error("[Buyer Analytics Error]", error);
        return apiInternalError("Failed to fetch buyer analytics");
    }
}
