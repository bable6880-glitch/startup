import { NextRequest, NextResponse } from "next/server";
import { guardAdminPortal } from "@/lib/admin-auth/guard";
import { db } from "@/lib/db";
import { users, adminAuditLog } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const auth = await guardAdminPortal(req);
    if (!auth.ok) return auth.response;

    try {
        const user = await db.query.users.findFirst({
            where: eq(users.id, params.id)
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({ user });
    } catch (error) {
        console.error("Failed to fetch user:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const auth = await guardAdminPortal(req);
    if (!auth.ok) return auth.response;

    try {
        const body = await req.json();
        const { isActive, role } = body;

        // Ensure at least one field to update
        if (isActive === undefined && role === undefined) {
            return NextResponse.json({ error: "No update fields provided" }, { status: 400 });
        }

        const updateData: any = {};
        let actionDesc = "";

        if (isActive !== undefined) {
            updateData.isActive = isActive;
            actionDesc += isActive ? "Unbanned user. " : "Banned user. ";
        }
        
        if (role !== undefined) {
            updateData.role = role;
            actionDesc += `Changed role to ${role}. `;
        }

        updateData.updatedAt = new Date();

        const result = await db.update(users)
            .set(updateData)
            .where(eq(users.id, params.id))
            .returning();

        if (result.length === 0) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Log to audit table
        await db.insert(adminAuditLog).values({
            adminId: auth.adminId!,
            action: actionDesc.trim(),
            targetType: "user",
            targetId: params.id,
            ipAddress: req.headers.get("x-forwarded-for") || "unknown"
        });

        return NextResponse.json({ success: true, user: result[0] });
    } catch (error) {
        console.error("Failed to update user:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
