import { NextRequest, NextResponse } from "next/server";
import { guardAdminPortal } from "@/lib/admin-auth/guard";
import { db } from "@/lib/db";
import { commissionLedger, kitchens, orders, users } from "@/lib/db/schema";
import { desc, sql, ilike, or, count, eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
    const auth = await guardAdminPortal(req);
    if (!auth.ok) return auth.response;

    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const search = searchParams.get("search") || "";

        const offset = (page - 1) * limit;

        let whereClause = undefined;
        if (search) {
            whereClause = or(
                ilike(kitchens.name, `%${search}%`),
                ilike(orders.id, `%${search}%`)
            );
        }

        const totalResult = await db
            .select({ count: count() })
            .from(commissionLedger)
            .leftJoin(kitchens, eq(commissionLedger.kitchenId, kitchens.id))
            .leftJoin(orders, eq(commissionLedger.orderId, orders.id))
            .where(whereClause);
        
        const total = totalResult[0].count;

        const data = await db
            .select({
                id: commissionLedger.id,
                orderAmountRs: commissionLedger.orderAmountRs,
                commissionRate: commissionLedger.commissionRate,
                commissionAmountRs: commissionLedger.commissionAmountRs,
                netAmountRs: commissionLedger.netAmountRs,
                status: commissionLedger.status,
                createdAt: commissionLedger.createdAt,
                kitchenName: kitchens.name,
                orderId: orders.id,
                cookName: users.name,
            })
            .from(commissionLedger)
            .leftJoin(kitchens, eq(commissionLedger.kitchenId, kitchens.id))
            .leftJoin(orders, eq(commissionLedger.orderId, orders.id))
            .leftJoin(users, eq(commissionLedger.cookId, users.id))
            .where(whereClause)
            .orderBy(desc(commissionLedger.createdAt))
            .limit(limit)
            .offset(offset);

        // Also calculate totals for summary cards
        const summaryRaw = await db.execute(sql`
            SELECT 
                COALESCE(SUM(order_amount_rs), 0) as total_volume,
                COALESCE(SUM(commission_amount_rs), 0) as total_commission
            FROM commission_ledger
        `);
        const summary = summaryRaw.rows[0];

        return NextResponse.json({
            data,
            summary: {
                totalVolume: Number(summary.total_volume),
                totalCommission: Number(summary.total_commission)
            },
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Failed to fetch commission ledger:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
