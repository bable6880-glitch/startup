import { NextRequest, NextResponse } from "next/server";
import { requireSeller } from "@/lib/auth/seller-guard";
import { guardFeatureAccess, PlanFeatureError } from "@/lib/plans/plan-guards";
import { db } from "@/lib/db";
import { meals, kitchens, orderItems, orders } from "@/lib/db/schema";
import { eq, and, isNull, ne, sql, count, avg } from "drizzle-orm";
import { logger } from "@/lib/utils/logger";
import { redis } from "@/lib/redis";

export async function POST(req: NextRequest) {
    try {
        const guard = await requireSeller(req);
        if (!guard.ok) return guard.response;
        
        try {
            await guardFeatureAccess(guard.kitchen.id, 'ai_pricing');
        } catch (error) {
            if (error instanceof PlanFeatureError) {
                return NextResponse.json({ error: error.message }, { status: 403 });
            }
            throw error;
        }

        const body = await req.json();
        const mealId = body.mealId;
        
        if (!mealId) {
            return NextResponse.json({ error: "Meal ID required" }, { status: 400 });
        }

        // 1. Check cache first
        const cacheKey = `ai:pricing:${mealId}`;
        if (redis) {
            const cached = await redis.get(cacheKey);
            if (cached) {
                return NextResponse.json({ success: true, suggestion: typeof cached === 'string' ? JSON.parse(cached) : cached });
            }
        }

        // 2. Get meal from DB
        const mealData = await db.query.meals.findFirst({
            where: and(
                eq(meals.id, mealId),
                eq(meals.kitchenId, guard.kitchen.id)
            ),
            with: { kitchen: true }
        });

        if (!mealData) {
            return NextResponse.json({ error: "Meal not found" }, { status: 404 });
        }

        // 3. Get market average (DB only)
        const marketResult = await db.execute(sql`
            SELECT AVG(m.price) as avg_price, COUNT(*) as sample_size
            FROM meals m
            JOIN kitchens k ON k.id = m.kitchen_id
            WHERE k.city_slug = ${mealData.kitchen.citySlug}
              AND m.category = ${mealData.category}
              AND m.is_available = true
              AND m.deleted_at IS NULL
              AND m.id != ${mealId}
        `);

        const avgPriceRaw = marketResult.rows[0]?.avg_price;
        const marketAvg = avgPriceRaw ? Number(avgPriceRaw) : null;
        const sampleSize = Number(marketResult.rows[0]?.sample_size || 0);

        // 4. Get this meal's 30-day order count
        const orderResult = await db.execute(sql`
            SELECT COUNT(*) as count
            FROM order_items oi
            JOIN orders o ON o.id = oi.order_id
            WHERE oi.meal_id = ${mealId}
              AND o.created_at > NOW() - INTERVAL '30 days'
              AND o.status = 'COMPLETED'
        `);
        const orderCount = Number(orderResult.rows[0]?.count || 0);

        let result;

        // 5. Call Anthropic API
        try {
            if (!process.env.ANTHROPIC_API_KEY) {
                throw new Error("Missing Anthropic API Key");
            }

            const promptStr = `Meal: ${mealData.name}\nCategory: ${mealData.category}\nCity: ${mealData.kitchen.city}\nCurrent price: Rs.${mealData.price}\nMarket average: Rs.${marketAvg || 'Unknown'} (${sampleSize} similar meals)\nOrders in last 30 days: ${orderCount}\nGive pricing recommendation.`;

            const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": process.env.ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01"
                },
                body: JSON.stringify({
                    model: 'claude-haiku-4-5-20251001',
                    max_tokens: 150,
                    system: `You are a pricing advisor for Pakistani home cooks on a food marketplace. Analyze the data and give a clear pricing recommendation. Be concise and practical. Respond ONLY in this exact JSON format: {"action":"raise|lower|keep","suggestedPriceRs":number,"changePercent":number,"reason":"one sentence max"}`,
                    messages: [
                        { role: "user", content: promptStr }
                    ]
                })
            });

            if (!anthropicRes.ok) {
                const text = await anthropicRes.text();
                throw new Error(`Anthropic API Error: ${anthropicRes.status} ${text}`);
            }

            const aiData = await anthropicRes.json();
            const responseText = aiData.content[0].text;

            // 6. Parse JSON response safely
            const parsed = JSON.parse(responseText);
            if (!parsed.action || typeof parsed.suggestedPriceRs !== 'number') {
                throw new Error("Invalid response format from Anthropic");
            }
            result = parsed;
            
        } catch (error) {
            logger.warn("AI Pricing fallback triggered", { error });
            // FALLBACK
            result = {
                action: 'keep',
                suggestedPriceRs: Number(mealData.price),
                changePercent: 0,
                reason: marketAvg
                    ? `Market average in ${mealData.kitchen.city} is Rs.${Math.round(marketAvg)}`
                    : 'Insufficient market data available'
            };
        }

        // 7. Cache result
        if (redis) {
            await redis.set(cacheKey, JSON.stringify(result), { ex: 3600 });
        }

        // 8. Return result
        return NextResponse.json({ success: true, suggestion: result });

    } catch (error) {
        logger.error("Failed to generate AI pricing", { error });
        // Never return 500, we catch all logic errors inside the fallback try-catch above
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
