import { NextRequest, NextResponse } from "next/server";
import { requireSeller } from "@/lib/auth/seller-guard";
import { db } from "@/lib/db";
import { orders, orderItems, meals, commissionLedger } from "@/lib/db/schema";
import { eq, and, sql, gte } from "drizzle-orm";

export async function GET(req: NextRequest) {
    try {
        const guard = await requireSeller(req);
        if (!guard.ok) return guard.response;

        const kitchenId = guard.kitchen.id;
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

        // 1. This month's revenue & order count
        const thisMonthStats = await db.execute(sql`
            SELECT 
                COUNT(*) as order_count,
                COALESCE(SUM(total_amount), 0) as revenue
            FROM orders
            WHERE kitchen_id = ${kitchenId}
              AND status = 'COMPLETED'
              AND created_at >= ${startOfMonth}
        `);

        // 2. Last month's revenue (for comparison)
        const lastMonthStats = await db.execute(sql`
            SELECT 
                COUNT(*) as order_count,
                COALESCE(SUM(total_amount), 0) as revenue
            FROM orders
            WHERE kitchen_id = ${kitchenId}
              AND status = 'COMPLETED'
              AND created_at >= ${startOfLastMonth}
              AND created_at <= ${endOfLastMonth}
        `);

        // 3. Commission summary
        const commissionStats = await db.execute(sql`
            SELECT 
                COALESCE(SUM(order_amount_rs), 0) as total_order_volume,
                COALESCE(SUM(commission_amount_rs), 0) as total_commission,
                COALESCE(SUM(net_amount_rs), 0) as total_net_earnings
            FROM commission_ledger
            WHERE kitchen_id = ${kitchenId}
        `);

        // 4. Monthly commission breakdown (last 6 months)
        const monthlyBreakdown = await db.execute(sql`
            SELECT 
                TO_CHAR(created_at, 'YYYY-MM') as month,
                TO_CHAR(created_at, 'Mon') as month_label,
                COALESCE(SUM(order_amount_rs), 0) as revenue,
                COALESCE(SUM(commission_amount_rs), 0) as commission,
                COALESCE(SUM(net_amount_rs), 0) as net_earnings,
                COUNT(*) as order_count
            FROM commission_ledger
            WHERE kitchen_id = ${kitchenId}
              AND created_at >= NOW() - INTERVAL '6 months'
            GROUP BY TO_CHAR(created_at, 'YYYY-MM'), TO_CHAR(created_at, 'Mon')
            ORDER BY month DESC
            LIMIT 6
        `);

        // 5. Top selling meals this month
        const topMeals = await db.execute(sql`
            SELECT 
                m.name as meal_name,
                m.image_url,
                SUM(oi.quantity) as total_sold,
                SUM(oi.price_at_order * oi.quantity) as total_revenue
            FROM order_items oi
            JOIN orders o ON o.id = oi.order_id
            JOIN meals m ON m.id = oi.meal_id
            WHERE o.kitchen_id = ${kitchenId}
              AND o.status = 'COMPLETED'
              AND o.created_at >= ${startOfMonth}
            GROUP BY m.id, m.name, m.image_url
            ORDER BY total_sold DESC
            LIMIT 5
        `);

        // 6. Daily orders this month (for chart)
        const dailyOrders = await db.execute(sql`
            SELECT 
                TO_CHAR(created_at, 'DD') as day,
                COUNT(*) as count,
                COALESCE(SUM(total_amount), 0) as revenue
            FROM orders
            WHERE kitchen_id = ${kitchenId}
              AND status = 'COMPLETED'
              AND created_at >= ${startOfMonth}
            GROUP BY TO_CHAR(created_at, 'DD')
            ORDER BY day
        `);

        const thisMonth = thisMonthStats.rows[0];
        const lastMonth = lastMonthStats.rows[0];
        const commission = commissionStats.rows[0];

        const thisRevenue = Number(thisMonth?.revenue ?? 0);
        const lastRevenue = Number(lastMonth?.revenue ?? 0);
        const revenueChange = lastRevenue > 0
            ? ((thisRevenue - lastRevenue) / lastRevenue * 100).toFixed(1)
            : null;

        return NextResponse.json({
            success: true,
            data: {
                summary: {
                    thisMonth: {
                        revenue: thisRevenue,
                        orderCount: Number(thisMonth?.order_count ?? 0),
                    },
                    lastMonth: {
                        revenue: lastRevenue,
                        orderCount: Number(lastMonth?.order_count ?? 0),
                    },
                    revenueChangePercent: revenueChange ? Number(revenueChange) : null,
                },
                commission: {
                    totalOrderVolume: Number(commission?.total_order_volume ?? 0),
                    totalCommission: Number(commission?.total_commission ?? 0),
                    totalNetEarnings: Number(commission?.total_net_earnings ?? 0),
                },
                monthlyBreakdown: monthlyBreakdown.rows.map(r => ({
                    month: r.month,
                    monthLabel: r.month_label,
                    revenue: Number(r.revenue),
                    commission: Number(r.commission),
                    netEarnings: Number(r.net_earnings),
                    orderCount: Number(r.order_count),
                })),
                topMeals: topMeals.rows.map(r => ({
                    name: r.meal_name,
                    imageUrl: r.image_url,
                    totalSold: Number(r.total_sold),
                    totalRevenue: Number(r.total_revenue),
                })),
                dailyOrders: dailyOrders.rows.map(r => ({
                    day: r.day,
                    count: Number(r.count),
                    revenue: Number(r.revenue),
                })),
            }
        });
    } catch (error) {
        console.error("[Seller Analytics Error]", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
