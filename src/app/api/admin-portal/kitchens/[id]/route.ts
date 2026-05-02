import { NextRequest, NextResponse } from "next/server";
import { guardAdminPortal } from "@/lib/admin-auth/guard";
import { db } from "@/lib/db";
import { kitchens, adminAuditLog } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = await guardAdminPortal(req);
    if (!auth.ok) return auth.response;
    const { id } = await params;

    try {
        const kitchen = await db.query.kitchens.findFirst({
            where: eq(kitchens.id, id),
            with: {
                owner: true,
            }
        });

        if (!kitchen) {
            return NextResponse.json({ error: "Kitchen not found" }, { status: 404 });
        }

        return NextResponse.json({ kitchen });
    } catch (error) {
        console.error("Failed to fetch kitchen:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const auth = await guardAdminPortal(req);
    if (!auth.ok) return auth.response;
    const { id } = await params;

    try {
        const body = await req.json();
        const { status, isVerified } = body;

        if (status === undefined && isVerified === undefined) {
            return NextResponse.json({ error: "No update fields provided" }, { status: 400 });
        }

        const updateData: any = {};
        let actionDesc = "";

        if (status !== undefined) {
            updateData.status = status;
            actionDesc += `Changed kitchen status to ${status}. `;
        }
        
        if (isVerified !== undefined) {
            updateData.isVerified = isVerified;
            actionDesc += isVerified ? "Verified kitchen. " : "Unverified kitchen. ";
        }

        updateData.updatedAt = new Date();

        const result = await db.update(kitchens)
            .set(updateData)
            .where(eq(kitchens.id, id))
            .returning();

        if (result.length === 0) {
            return NextResponse.json({ error: "Kitchen not found" }, { status: 404 });
        }

        // Log to audit table
        await db.insert(adminAuditLog).values({
            adminId: auth.admin.id,
            action: actionDesc.trim(),
            targetType: "kitchen",
            targetId: id,
            ipAddress: req.headers.get("x-forwarded-for") || "unknown"
        });

        return NextResponse.json({ success: true, kitchen: result[0] });
    } catch (error) {
        console.error("Failed to update kitchen:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
