import { NextRequest, NextResponse } from "next/server";
import { requireSeller } from "@/lib/auth/seller-guard";
import { db } from "@/lib/db";
import { potluckDeals, meals } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { logger } from "@/lib/utils/logger";
import { redis } from "@/lib/redis/index";

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const guard = await requireSeller(req);
        if (!guard.ok) return guard.response;
        const { kitchen } = guard;

        const { id } = await params;
        const dealId = id;
        const body = await req.json();
        
        const existingDeal = await db.query.potluckDeals.findFirst({
            where: and(
                eq(potluckDeals.id, dealId),
                eq(potluckDeals.kitchenId, kitchen.id)
            )
        });

        if (!existingDeal) {
            return NextResponse.json({ error: "Deal not found or unauthorized" }, { status: 404 });
        }

        const updates: any = { updatedAt: new Date() };

        // Status updates
        if (body.status && ['ACTIVE', 'CANCELLED', 'PAUSED', 'SCHEDULED'].includes(body.status)) {
            updates.status = body.status;
            
            if (body.status === 'ACTIVE') {
                updates.activatedAt = new Date();
            } else if (body.status === 'CANCELLED') {
                updates.cancelledAt = new Date();
                updates.cancelReason = body.cancelReason || 'Cancelled by seller';
            }
        }

        // Deal detail updates (Edit form)
        if (body.title) updates.title = body.title;
        if (body.description !== undefined) updates.description = body.description;
        if (body.expiresAt) updates.expiresAt = new Date(body.expiresAt);
        if (body.imageUrl) updates.imageUrl = body.imageUrl;
        
        // Critical updates that affect pricing and limits (only allowed if no one has ordered yet)
        if (existingDeal.currentOrderCount === 0 || existingDeal.currentOrderCount === null) {
            if (body.totalPlatesAvailable) updates.totalPlatesAvailable = Number(body.totalPlatesAvailable);
            if (body.targetOrderCount) updates.targetOrderCount = Number(body.targetOrderCount);
            if (body.pricePerPlateRs) updates.pricePerPlateRs = body.pricePerPlateRs.toString();
            if (body.regularPriceRs) updates.regularPriceRs = body.regularPriceRs.toString();
        } else if (
            body.totalPlatesAvailable || body.targetOrderCount || body.pricePerPlateRs || body.regularPriceRs
        ) {
            // Log that we ignored critical field updates, but allow the rest of the payload to process
            logger.warn("Attempted to modify critical potluck fields after orders placed", { dealId });
        }

        const [updatedDeal] = await db.update(potluckDeals)
            .set(updates)
            .where(eq(potluckDeals.id, dealId))
            .returning();

        // Sync updates to the hidden meal if it exists
        if (updatedDeal.mealId) {
            const mealUpdates: any = {};
            if (updates.title) mealUpdates.name = `[Potluck] ${updates.title}`;
            if (updates.description !== undefined) mealUpdates.description = updates.description;
            if (updates.pricePerPlateRs) mealUpdates.price = Number(updates.pricePerPlateRs);
            if (updates.imageUrl) mealUpdates.imageUrl = updates.imageUrl;
            
            if (Object.keys(mealUpdates).length > 0) {
                mealUpdates.updatedAt = new Date();
                await db.update(meals)
                    .set(mealUpdates)
                    .where(eq(meals.id, updatedDeal.mealId));
            }
        }

        // Publish SSE update
        if (redis && updatedDeal.status === 'ACTIVE') {
            await redis.publish('potluck_updates', JSON.stringify({
                type: 'DEAL_ACTIVATED',
                deal: updatedDeal
            }));
        }

        return NextResponse.json({ success: true, deal: updatedDeal });
    } catch (error) {
        logger.error("Failed to update potluck", { error });
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
