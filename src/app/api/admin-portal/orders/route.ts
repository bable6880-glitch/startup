import { NextRequest, NextResponse } from "next/server";
import { guardAdminPortal } from "@/lib/admin-auth/guard";
import { db } from "@/lib/db";
import { orders, kitchens, users } from "@/lib/db/schema";
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
                ilike(orders.id, `%${search}%`),
                ilike(kitchens.name, `%${search}%`),
                ilike(users.name, `%${search}%`)
            );
        }

        const totalResult = await db
            .select({ count: count() })
            .from(orders)
            .leftJoin(kitchens, eq(orders.kitchenId, kitchens.id))
            .leftJoin(users, eq(orders.customerId, users.id))
            .where(whereClause);
        
        const total = totalResult[0].count;

        const data = await db
            .select({
                id: orders.id,
                status: orders.status,
                totalAmount: orders.totalAmount,
                paymentMethod: orders.paymentMethod,
                paymentStatus: orders.paymentStatus,
                createdAt: orders.createdAt,
                kitchenName: kitchens.name,
                customerName: users.name,
                customerEmail: users.email,
                deliveryMode: orders.deliveryMode,
            })
            .from(orders)
            .leftJoin(kitchens, eq(orders.kitchenId, kitchens.id))
            .leftJoin(users, eq(orders.customerId, users.id))
            .where(whereClause)
            .orderBy(desc(orders.createdAt))
            .limit(limit)
            .offset(offset);

        return NextResponse.json({
            data,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Failed to fetch orders:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
