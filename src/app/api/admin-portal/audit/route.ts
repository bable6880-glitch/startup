import { NextRequest, NextResponse } from "next/server";
import { guardAdminPortal } from "@/lib/admin-auth/guard";
import { db } from "@/lib/db";
import { adminAuditLog, adminUsers } from "@/lib/db/schema";
import { desc, ilike, or, count, eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
    const auth = await guardAdminPortal(req);
    if (!auth.ok) return auth.response;

    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const search = searchParams.get("search") || "";

        const offset = (page - 1) * limit;

        let whereClause = undefined;
        if (search) {
            whereClause = or(
                ilike(adminAuditLog.action, `%${search}%`),
                ilike(adminAuditLog.targetId, `%${search}%`),
                ilike(adminUsers.email, `%${search}%`)
            );
        }

        const totalResult = await db
            .select({ count: count() })
            .from(adminAuditLog)
            .leftJoin(adminUsers, eq(adminAuditLog.adminId, adminUsers.id))
            .where(whereClause);
        
        const total = totalResult[0].count;

        const data = await db
            .select({
                id: adminAuditLog.id,
                action: adminAuditLog.action,
                targetType: adminAuditLog.targetType,
                targetId: adminAuditLog.targetId,
                ipAddress: adminAuditLog.ipAddress,
                createdAt: adminAuditLog.createdAt,
                adminEmail: adminUsers.email,
                adminUsername: adminUsers.username,
            })
            .from(adminAuditLog)
            .leftJoin(adminUsers, eq(adminAuditLog.adminId, adminUsers.id))
            .where(whereClause)
            .orderBy(desc(adminAuditLog.createdAt))
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
        console.error("Failed to fetch audit log:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
