import { NextRequest, NextResponse } from 'next/server';
import { requireSeller } from '@/lib/auth/seller-guard';
import { guardFeatureAccess, PlanFeatureError } from '@/lib/plans/plan-guards';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { Redis } from '@upstash/redis';
import { logger } from '@/lib/utils/logger';

const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
    : null;

function getLast6MonthKeys() {
    const keys = [];
    const d = new Date();
    for (let i = 0; i < 6; i++) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        keys.push(`${year}-${month}`);
        d.setMonth(d.getMonth() - 1);
    }
    return keys;
}

export async function GET(req: NextRequest) {
    try {
        const guard = await requireSeller(req);
        if (!guard.ok) return guard.response;

        try {
            await guardFeatureAccess(guard.kitchen.id, 'digital_khata');
        } catch (error) {
            if (error instanceof PlanFeatureError) {
                return NextResponse.json({ error: error.message }, { status: 403 });
            }
            throw error;
        }

        const now = new Date();
        const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const cacheKey = `khata:summary:${guard.kitchen.id}:${currentMonthKey}`;

        if (redis) {
            const cached = await redis.get(cacheKey);
            if (cached) {
                return NextResponse.json(cached);
            }
        }

        const months = getLast6MonthKeys();
        const oldestMonthStr = months[months.length - 1] + '-01'; // First day of 6th month ago

        // Single DB query using Drizzle's sql template and GROUP BY
        const results = await db.execute(sql`
            SELECT
                to_char(entry_date, 'YYYY-MM') as month,
                SUM(CASE WHEN is_credit = true AND is_cancelled = false THEN amount_rs ELSE 0 END) as income,
                SUM(CASE WHEN is_credit = false AND is_cancelled = false THEN amount_rs ELSE 0 END) as expenses,
                SUM(CASE WHEN entry_type = 'COMMISSION' AND is_cancelled = false THEN amount_rs ELSE 0 END) as commission
            FROM khata_entries
            WHERE kitchen_id = ${guard.kitchen.id}
              AND entry_date >= ${oldestMonthStr}::date
            GROUP BY to_char(entry_date, 'YYYY-MM')
            ORDER BY month DESC
        `);

        // Map results by month for easy lookup
        const resultsByMonth = results.rows.reduce((acc: any, row: any) => {
            acc[row.month] = {
                income: Number(row.income) || 0,
                expenses: Number(row.expenses) || 0,
                commission: Number(row.commission) || 0,
            };
            return acc;
        }, {});

        // Fill in months with no data
        const filledData = months.map(month => {
            const data = resultsByMonth[month] || { income: 0, expenses: 0, commission: 0 };
            return {
                month,
                income: data.income,
                expenses: data.expenses,
                net: data.income - data.expenses,
                commission: data.commission
            };
        });

        const currentMonthData = filledData[0]; // the most recent one is index 0

        const responseData = {
            success: true,
            currentMonth: currentMonthData,
            history: filledData,
        };

        if (redis) {
            await redis.set(cacheKey, JSON.stringify(responseData), { ex: 300 }); // 5 minutes TTL
        }

        return NextResponse.json(responseData);

    } catch (error) {
        logger.error("Failed to fetch khata summary", { error });
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
