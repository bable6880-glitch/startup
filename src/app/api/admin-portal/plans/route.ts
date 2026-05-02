import { NextRequest, NextResponse } from "next/server";
import { guardAdminPortal } from "@/lib/admin-auth/guard";
import { db } from "@/lib/db";
import { planConfigs, adminAuditLog } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

export async function GET(req: NextRequest) {
    const auth = await guardAdminPortal(req);
    if (!auth.ok) return auth.response;

    try {
        const plans = await db.select().from(planConfigs).orderBy(asc(planConfigs.sortOrder));
        return NextResponse.json({ data: plans });
    } catch (error) {
        console.error("Failed to fetch plans:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    const auth = await guardAdminPortal(req);
    if (!auth.ok) return auth.response;

    try {
        const body = await req.json();
        const { id, updates } = body;

        if (!id || !updates) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        updates.updatedAt = new Date();

        const result = await db.update(planConfigs)
            .set(updates)
            .where(eq(planConfigs.id, id))
            .returning();

        if (result.length === 0) {
            return NextResponse.json({ error: "Plan not found" }, { status: 404 });
        }

        await db.insert(adminAuditLog).values({
            adminId: auth.admin.id,
            action: `Updated plan configuration for ${result[0].displayName}.`,
            targetType: "plan_config",
            targetId: id,
            ipAddress: req.headers.get("x-forwarded-for") || "unknown"
        });

        // Normally we would invalidate the redis cache here:
        // await invalidateCache(`plans:${result[0].region}`);

        return NextResponse.json({ success: true, plan: result[0] });
    } catch (error) {
        console.error("Failed to update plan:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
