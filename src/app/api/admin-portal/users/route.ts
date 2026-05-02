import { NextRequest, NextResponse } from "next/server";
import { guardAdminPortal } from "@/lib/admin-auth/guard";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { desc, sql, ilike, or, count } from "drizzle-orm";

export async function GET(req: NextRequest) {
    const auth = await guardAdminPortal(req);
    if (!auth.ok) return auth.response;

    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const search = searchParams.get("search") || "";

        const offset = (page - 1) * limit;

        // Build where clause
        let whereClause = undefined;
        if (search) {
            whereClause = or(
                ilike(users.name, `%${search}%`),
                ilike(users.email, `%${search}%`),
                ilike(users.phone, `%${search}%`)
            );
        }

        // Get total count
        const totalResult = await db
            .select({ count: count() })
            .from(users)
            .where(whereClause);
        
        const total = totalResult[0].count;

        // Get paginated data
        const data = await db
            .select({
                id: users.id,
                email: users.email,
                name: users.name,
                phone: users.phone,
                role: users.role,
                isActive: users.isActive,
                createdAt: users.createdAt,
                lastLoginAt: users.lastLoginAt,
            })
            .from(users)
            .where(whereClause)
            .orderBy(desc(users.createdAt))
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
        console.error("Failed to fetch users:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
