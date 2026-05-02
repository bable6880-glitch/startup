import { NextRequest, NextResponse } from "next/server";
import { guardAdminPortal } from "@/lib/admin-auth/guard";
import { db } from "@/lib/db";
import {
    users,
    kitchens,
    orders,
    subscriptions,
    commissionLedger,
    planConfigs,
} from "@/lib/db/schema";
import { sql, count, sum, eq, gte, and } from "drizzle-orm";
import { cached } from "@/lib/redis";

export async function GET(req: NextRequest) {
    const auth = await guardAdminPortal(req);
    if (!auth.ok) return auth.response;

    try {
        const cacheKey = "admin:analytics:dashboard";
        const ttl = 300; // 5 minutes

        const data = await cached(cacheKey, ttl, async () => {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            // 1. Quick Stats
            const [
                userCountResult,
                kitchenCountResult,
                orderCountResult,
                revenueResult,
            ] = await Promise.all([
                db.select({ value: count() }).from(users),
                db.select({ value: count() }).from(kitchens),
                db.select({ value: count() }).from(orders).where(eq(orders.status, "COMPLETED")),
                db.select({
                    gmv: sum(orders.totalAmount),
                    commission: sum(commissionLedger.commissionAmountRs),
                })
                .from(orders)
                .leftJoin(commissionLedger, eq(orders.id, commissionLedger.orderId))
                .where(eq(orders.status, "COMPLETED")),
            ]);

            const totalUsers = userCountResult[0].value;
            const totalKitchens = kitchenCountResult[0].value;
            const totalOrders = orderCountResult[0].value;
            const totalGMV = Number(revenueResult[0].gmv || 0) / 100; // Assuming stored in cents/paise
            const totalCommission = Number(revenueResult[0].commission || 0);

            // 2. Revenue Chart Data (Last 30 days)
            const revenueByDayRaw = await db.execute(sql`
                SELECT 
                    DATE(created_at) as date,
                    COALESCE(SUM(total_amount), 0) / 100 as gmv
                FROM orders
                WHERE status = 'COMPLETED' AND created_at >= ${thirtyDaysAgo}
                GROUP BY DATE(created_at)
                ORDER BY DATE(created_at) ASC
            `);

            const commissionByDayRaw = await db.execute(sql`
                SELECT 
                    DATE(created_at) as date,
                    COALESCE(SUM(commission_amount_rs), 0) as commission
                FROM commission_ledger
                WHERE created_at >= ${thirtyDaysAgo}
                GROUP BY DATE(created_at)
                ORDER BY DATE(created_at) ASC
            `);

            // Combine revenue and commission by date
            const revenueDataMap = new Map();
            // Fill past 30 days with 0s
            for (let i = 29; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dateStr = d.toISOString().split("T")[0];
                revenueDataMap.set(dateStr, { date: dateStr, gmv: 0, commission: 0 });
            }

            for (const row of revenueByDayRaw.rows) {
                const d = new Date(row.date as string).toISOString().split("T")[0];
                if (revenueDataMap.has(d)) {
                    revenueDataMap.get(d).gmv = Number(row.gmv);
                }
            }
            for (const row of commissionByDayRaw.rows) {
                const d = new Date(row.date as string).toISOString().split("T")[0];
                if (revenueDataMap.has(d)) {
                    revenueDataMap.get(d).commission = Number(row.commission);
                }
            }
            const revenueChartData = Array.from(revenueDataMap.values());

            // 3. Orders Chart Data (Last 30 days)
            const ordersByDayRaw = await db.execute(sql`
                SELECT 
                    DATE(created_at) as date,
                    COUNT(*) as count
                FROM orders
                WHERE created_at >= ${thirtyDaysAgo}
                GROUP BY DATE(created_at)
                ORDER BY DATE(created_at) ASC
            `);
            const ordersDataMap = new Map();
            for (let i = 29; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dateStr = d.toISOString().split("T")[0];
                ordersDataMap.set(dateStr, { date: dateStr, count: 0 });
            }
            for (const row of ordersByDayRaw.rows) {
                const d = new Date(row.date as string).toISOString().split("T")[0];
                if (ordersDataMap.has(d)) {
                    ordersDataMap.get(d).count = Number(row.count);
                }
            }
            const ordersChartData = Array.from(ordersDataMap.values());

            // 4. Plan Distribution
            const plansRaw = await db.execute(sql`
                SELECT p.display_name as name, COUNT(s.id) as value
                FROM subscriptions s
                JOIN plan_configs p ON s.plan_id = p.plan_id
                WHERE s.status = 'ACTIVE'
                GROUP BY p.display_name
            `);
            const planDistribution = plansRaw.rows.map(r => ({
                name: r.name,
                value: Number(r.value)
            }));

            // 5. User Growth (Customers vs Cooks)
            const userGrowthRaw = await db.execute(sql`
                SELECT 
                    DATE(created_at) as date,
                    COUNT(*) FILTER (WHERE role = 'CUSTOMER') as customers,
                    COUNT(*) FILTER (WHERE role = 'COOK') as cooks
                FROM users
                WHERE created_at >= ${thirtyDaysAgo}
                GROUP BY DATE(created_at)
                ORDER BY DATE(created_at) ASC
            `);
            const userGrowthMap = new Map();
            for (let i = 29; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const dateStr = d.toISOString().split("T")[0];
                userGrowthMap.set(dateStr, { date: dateStr, customers: 0, cooks: 0 });
            }
            for (const row of userGrowthRaw.rows) {
                const d = new Date(row.date as string).toISOString().split("T")[0];
                if (userGrowthMap.has(d)) {
                    userGrowthMap.get(d).customers = Number(row.customers);
                    userGrowthMap.get(d).cooks = Number(row.cooks);
                }
            }
            const userGrowthChartData = Array.from(userGrowthMap.values());

            // 6. Top Kitchens by Revenue
            const topKitchensRaw = await db.execute(sql`
                SELECT 
                    k.name,
                    COALESCE(SUM(o.total_amount), 0) / 100 as revenue
                FROM kitchens k
                JOIN orders o ON k.id = o.kitchen_id
                WHERE o.status = 'COMPLETED'
                GROUP BY k.id, k.name
                ORDER BY revenue DESC
                LIMIT 10
            `);
            const topKitchensData = topKitchensRaw.rows.map(r => ({
                name: r.name,
                revenue: Number(r.revenue)
            }));

            // 7. Live Data (Pending Orders) - Usually we might not cache this part, 
            // but for a dashboard overview 5 min is fine.
            const liveOrdersRaw = await db.select({ count: count() }).from(orders).where(eq(orders.status, "PENDING"));
            const liveOrdersCount = liveOrdersRaw[0].count;

            return {
                stats: {
                    totalUsers,
                    totalKitchens,
                    totalOrders,
                    totalGMV,
                    totalCommission,
                    liveOrdersCount,
                },
                charts: {
                    revenue: revenueChartData,
                    orders: ordersChartData,
                    plans: planDistribution,
                    userGrowth: userGrowthChartData,
                    topKitchens: topKitchensData,
                }
            };
        });

        return NextResponse.json(data);
    } catch (error) {
        console.error("Admin analytics error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
