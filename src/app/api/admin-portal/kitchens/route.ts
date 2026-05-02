import { NextRequest, NextResponse } from "next/server";
import { guardAdminPortal } from "@/lib/admin-auth/guard";
import { db } from "@/lib/db";
import { kitchens, users } from "@/lib/db/schema";
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
                ilike(kitchens.city, `%${search}%`),
                ilike(kitchens.contactPhone, `%${search}%`)
            );
        }

        const totalResult = await db
            .select({ count: count() })
            .from(kitchens)
            .where(whereClause);
        
        const total = totalResult[0].count;

        const data = await db
            .select({
                id: kitchens.id,
                name: kitchens.name,
                city: kitchens.city,
                status: kitchens.status,
                isVerified: kitchens.isVerified,
                createdAt: kitchens.createdAt,
                ownerEmail: users.email,
                ownerName: users.name,
            })
            .from(kitchens)
            .leftJoin(users, eq(kitchens.ownerId, users.id))
            .where(whereClause)
            .orderBy(desc(kitchens.createdAt))
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
        console.error("Failed to fetch kitchens:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
