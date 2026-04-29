import { NextRequest, NextResponse } from "next/server";
import { requireSeller } from "@/lib/auth/seller-guard";
import { db } from "@/lib/db";
import { potluckDeals } from "@/lib/db/schema";
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
        
        // Allowed updates
        const updates: any = {};
        if (body.status === 'ACTIVE' || body.status === 'CANCELLED') {
            updates.status = body.status;
            updates.updatedAt = new Date();
            
            if (body.status === 'ACTIVE') {
                updates.activatedAt = new Date();
            } else if (body.status === 'CANCELLED') {
                updates.cancelledAt = new Date();
                updates.cancelReason = body.cancelReason || 'Cancelled by seller';
            }
        }

        const [updatedDeal] = await db.update(potluckDeals)
            .set(updates)
            .where(
                and(
                    eq(potluckDeals.id, dealId),
                    eq(potluckDeals.kitchenId, kitchen.id)
                )
            )
            .returning();

        if (!updatedDeal) {
            return NextResponse.json({ error: "Deal not found or unauthorized" }, { status: 404 });
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
