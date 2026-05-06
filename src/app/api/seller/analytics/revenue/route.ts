import { NextRequest, NextResponse } from "next/server";
import { requireSeller } from "@/lib/auth/seller-guard";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";
import { cached } from "@/lib/redis";

export async function GET(request: NextRequest) {
    try {
        const guard = await requireSeller(request);
        if (!guard.ok) return guard.response;
        const { kitchen } = guard;

        // Verify Elite plan
        const { getKitchenPlanAccess } = await import("@/lib/plans/plan-access");
        const access = await getKitchenPlanAccess(kitchen.id);
        if (access.planId !== 'elite') {
            return NextResponse.json({ error: "Elite plan required" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const period = searchParams.get('period') || '30d';

        const intervalMap: Record<string, string> = {
            '7d': '7 days',
            '30d': '30 days',
            '90d': '90 days',
        };
        const interval = intervalMap[period] || '30 days';

        const cacheKey = `analytics:revenue:${kitchen.id}:${period}`;

        const data = await cached(cacheKey, 300, async () => {
            const result = await db.execute(sql`
                SELECT
                    DATE(created_at) as date,
                    COALESCE(SUM(total_amount), 0)::int as revenue,
                    COUNT(*)::int as order_count
                FROM orders
                WHERE kitchen_id = ${kitchen.id}
                    AND status = 'COMPLETED'
                    AND created_at >= NOW() - INTERVAL '${sql.raw(interval)}'
                GROUP BY DATE(created_at)
                ORDER BY date ASC
            `);

            const rows = (result as any).rows || result || [];
            const dates = rows.map((r: any) => r.date?.toISOString?.()?.split('T')[0] || String(r.date));
            const revenues = rows.map((r: any) => Number(r.revenue || 0));
            const orderCounts = rows.map((r: any) => Number(r.order_count || 0));

            return {
                dates,
                revenues,
                orders: orderCounts,
                totalRevenue: revenues.reduce((a: number, b: number) => a + b, 0),
                totalOrders: orderCounts.reduce((a: number, b: number) => a + b, 0),
            };
        });

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("[Revenue Analytics Error]", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
