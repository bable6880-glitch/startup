import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { kitchens } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { apiUnauthorized, apiForbidden, apiNotFound, apiInternalError } from "@/lib/utils/api-response";
import { requireSeller } from "@/lib/auth/seller-guard";

// PATCH — update kitchen images (profileImageUrl, coverImageUrl, deliveryOptions)
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: kitchenId } = await params;
        const guard = await requireSeller(req, kitchenId);
        if (!guard.ok) return guard.response;

        const body = await req.json();
        const updateData: Record<string, unknown> = {};

        if (body.profileImageUrl !== undefined) updateData.profileImageUrl = body.profileImageUrl;
        if (body.coverImageUrl !== undefined) updateData.coverImageUrl = body.coverImageUrl;
        if (body.deliveryOptions !== undefined) updateData.deliveryOptions = body.deliveryOptions;
        if (body.name !== undefined) updateData.name = body.name;
        if (body.description !== undefined) updateData.description = body.description;
        if (body.contactPhone !== undefined) updateData.contactPhone = body.contactPhone;
        if (body.contactWhatsapp !== undefined) updateData.contactWhatsapp = body.contactWhatsapp;

        updateData.updatedAt = new Date();

        const updated = await db
            .update(kitchens)
            .set(updateData)
            .where(eq(kitchens.id, kitchenId))
            .returning();

        return NextResponse.json({ success: true, data: updated[0] });
    } catch (error) {
        console.error("Kitchen settings update error:", error);
        return apiInternalError();
    }
}
