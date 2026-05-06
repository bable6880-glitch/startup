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

        const cacheKey = `analytics:insights:${kitchen.id}`;

        const data = await cached(cacheKey, 86400, async () => {
            // 1. Peak ordering day of week (last 30 days)
            let peakDay: string | null = null;
            try {
                const peakResult = await db.execute(sql`
                    SELECT TO_CHAR(created_at, 'Day') as day_name, COUNT(*)::int as cnt
                    FROM orders
                    WHERE kitchen_id = ${kitchen.id}
                        AND status = 'COMPLETED'
                        AND created_at >= NOW() - INTERVAL '30 days'
                    GROUP BY TO_CHAR(created_at, 'Day')
                    ORDER BY cnt DESC
                    LIMIT 1
                `);
                const rows = (peakResult as any).rows || peakResult || [];
                if (rows.length > 0) peakDay = rows[0].day_name?.trim() || null;
            } catch { /* non-critical */ }

            // 2. Best selling meal (by count)
            let bestSeller: string | null = null;
            try {
                const bestResult = await db.execute(sql`
                    SELECT m.name as meal_name, SUM(oi.quantity)::int as total_qty
                    FROM order_items oi
                    JOIN meals m ON m.id = oi.meal_id
                    JOIN orders o ON o.id = oi.order_id
                    WHERE o.kitchen_id = ${kitchen.id}
                        AND o.status = 'COMPLETED'
                        AND o.created_at >= NOW() - INTERVAL '30 days'
                    GROUP BY m.name
                    ORDER BY total_qty DESC
                    LIMIT 1
                `);
                const rows = (bestResult as any).rows || bestResult || [];
                if (rows.length > 0) bestSeller = rows[0].meal_name || null;
            } catch { /* non-critical */ }

            // 3. Revenue trend (this month vs last month)
            let trend: number | null = null;
            let ordersThisMonth = 0;
            try {
                const trendResult = await db.execute(sql`
                    SELECT
                        COALESCE(SUM(CASE WHEN created_at >= DATE_TRUNC('month', NOW()) THEN total_amount ELSE 0 END), 0)::int as this_month,
                        COALESCE(SUM(CASE WHEN created_at >= DATE_TRUNC('month', NOW()) - INTERVAL '1 month' AND created_at < DATE_TRUNC('month', NOW()) THEN total_amount ELSE 0 END), 0)::int as last_month,
                        COUNT(CASE WHEN created_at >= DATE_TRUNC('month', NOW()) THEN 1 END)::int as orders_this_month
                    FROM orders
                    WHERE kitchen_id = ${kitchen.id} AND status = 'COMPLETED'
                `);
                const rows = (trendResult as any).rows || trendResult || [];
                if (rows.length > 0) {
                    const thisMonth = Number(rows[0].this_month || 0);
                    const lastMonth = Number(rows[0].last_month || 0);
                    ordersThisMonth = Number(rows[0].orders_this_month || 0);
                    trend = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : null;
                }
            } catch { /* non-critical */ }

            // 4. AI tip from Anthropic (best-effort)
            let aiTip: string | null = null;
            try {
                const anthropicKey = process.env.ANTHROPIC_API_KEY;
                if (anthropicKey && bestSeller) {
                    const city = (kitchen as any).city || 'Pakistan';
                    const trendStr = trend !== null ? `${trend}%` : 'unknown';

                    const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-api-key': anthropicKey,
                            'anthropic-version': '2023-06-01',
                        },
                        body: JSON.stringify({
                            model: 'claude-haiku-4-5-20251001',
                            max_tokens: 80,
                            system: 'You are a business advisor for Pakistani home cooks. Give ONE actionable tip in ONE sentence. Be specific.',
                            messages: [{
                                role: 'user',
                                content: `${ordersThisMonth} orders this month, best seller: ${bestSeller}, city: ${city}, revenue trend: ${trendStr}`,
                            }],
                        }),
                    });

                    if (aiRes.ok) {
                        const aiData = await aiRes.json();
                        const text = aiData.content?.[0]?.text;
                        if (text) aiTip = text.trim();
                    }
                }
            } catch {
                // AI call failed — fallback handled below
            }

            return {
                peakDay,
                bestSeller,
                aiTip,
                trend,
                ordersThisMonth,
            };
        });

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("[AI Insights Error]", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
