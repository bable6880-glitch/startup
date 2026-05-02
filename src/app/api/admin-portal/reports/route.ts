import { NextRequest, NextResponse } from "next/server";
import { guardAdminPortal } from "@/lib/admin-auth/guard";
import { db } from "@/lib/db";
import { reports, users } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET(req: NextRequest) {
    const auth = await guardAdminPortal(req);
    if (!auth.ok) return auth.response;

    try {
        const data = await db
            .select({
                id: reports.id,
                targetType: reports.targetType,
                targetId: reports.targetId,
                reason: reports.reason,
                details: reports.details,
                status: reports.status,
                createdAt: reports.createdAt,
                reporterName: users.name,
                reporterEmail: users.email,
            })
            .from(reports)
            .leftJoin(users, eq(reports.reporterId, users.id))
            .orderBy(desc(reports.createdAt));

        return NextResponse.json({ data });
    } catch (error) {
        console.error("Failed to fetch reports:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
