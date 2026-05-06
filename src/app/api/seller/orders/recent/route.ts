import { NextRequest, NextResponse } from "next/server";
import { requireSeller } from "@/lib/auth/seller-guard";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
    try {
        const guard = await requireSeller(request);
        if (!guard.ok) return guard.response;
        const { kitchen } = guard;

        const recentOrders = await db.query.orders.findMany({
            where: eq(orders.kitchenId, kitchen.id),
            orderBy: [desc(orders.createdAt)],
            limit: 10,
            with: {
                customer: { columns: { id: true, name: true } },
                items: {
                    with: { meal: { columns: { id: true, name: true } } },
                    limit: 3,
                },
            },
        });

        const data = recentOrders.map(o => {
            const mealNames = o.items.map(i => (i as any).meal?.name || 'Item').filter(Boolean);
            let itemsSummary = mealNames[0] || 'Order';
            if (mealNames.length > 1) itemsSummary += ` + ${mealNames.length - 1} more`;

            return {
                id: o.id,
                customerName: (o as any).customer?.name || o.customerName || 'Customer',
                itemsSummary,
                totalAmount: o.totalAmount ?? 0,
                status: o.status,
                createdAt: o.createdAt?.toISOString() || new Date().toISOString(),
            };
        });

        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error("[Recent Orders Error]", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
