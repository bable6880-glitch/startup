import { NextRequest, NextResponse } from "next/server";
import { guardAdminPortal } from "@/lib/admin-auth/guard";
import { db } from "@/lib/db";
import { reports, adminAuditLog } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const auth = await guardAdminPortal(req);
    if (!auth.ok) return auth.response;

    try {
        const body = await req.json();
        const { status, resolution } = body;

        if (!status) {
            return NextResponse.json({ error: "Status is required" }, { status: 400 });
        }

        const updateData: any = { status };
        let actionDesc = `Updated report status to ${status}. `;

        if (resolution !== undefined) {
            updateData.resolution = resolution;
        }

        if (status === "RESOLVED" || status === "DISMISSED" || status === "REVIEWED") {
            updateData.reviewedBy = auth.adminId;
            updateData.reviewedAt = new Date();
        }

        const result = await db.update(reports)
            .set(updateData)
            .where(eq(reports.id, params.id))
            .returning();

        if (result.length === 0) {
            return NextResponse.json({ error: "Report not found" }, { status: 404 });
        }

        await db.insert(adminAuditLog).values({
            adminId: auth.adminId!,
            action: actionDesc.trim(),
            targetType: "report",
            targetId: params.id,
            ipAddress: req.headers.get("x-forwarded-for") || "unknown"
        });

        return NextResponse.json({ success: true, report: result[0] });
    } catch (error) {
        console.error("Failed to update report:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
