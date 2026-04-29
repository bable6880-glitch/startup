import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { potluckDeals, potluckOrders } from "@/lib/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { reservePotluckSchema } from "@/lib/validations/potluck";
import { logger } from "@/lib/utils/logger";
import { redis } from "@/lib/redis/index";
import { getAuthUser } from "@/lib/auth/get-auth-user";

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = await getAuthUser(req);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const dealId = params.id;
        const body = await req.json();
        const parsed = reservePotluckSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });
        }

        const { quantity } = parsed.data;

        // DB Transaction for safe inventory checking
        const result = await db.transaction(async (tx) => {
            const [deal] = await tx
                .select()
                .from(potluckDeals)
                .where(eq(potluckDeals.id, dealId))
                .for('update'); // Lock row for update

            if (!deal) {
                throw new Error("Deal not found");
            }

            if (deal.status !== 'ACTIVE') {
                throw new Error("Deal is not active");
            }

            const remaining = deal.totalPlatesAvailable - (deal.currentOrderCount || 0);
            if (quantity > remaining) {
                throw new Error(`Only ${remaining} plates remaining`);
            }

            // Check if user already ordered
            const existingOrder = await tx.query.potluckOrders.findFirst({
                where: and(
                    eq(potluckOrders.potluckDealId, dealId),
                    eq(potluckOrders.customerId, user.id)
                )
            });

            if (existingOrder) {
                throw new Error("You have already reserved plates for this deal");
            }

            const totalAmountRs = Number(deal.pricePerPlateRs) * quantity;

            // Create order
            const [order] = await tx.insert(potluckOrders).values({
                potluckDealId: dealId,
                customerId: user.id,
                quantity,
                totalAmountRs: totalAmountRs.toString(),
                status: 'RESERVED',
            }).returning();

            // Increment deal count
            const newCount = (deal.currentOrderCount || 0) + quantity;
            let newStatus: any = deal.status;
            
            if (newCount >= deal.totalPlatesAvailable) {
                newStatus = 'FILLED';
            }

            const [updatedDeal] = await tx.update(potluckDeals)
                .set({
                    currentOrderCount: newCount,
                    status: newStatus as any,
                    updatedAt: new Date()
                })
                .where(eq(potluckDeals.id, dealId))
                .returning();

            return { order, updatedDeal };
        });

        // Publish SSE update for realtime UI sync
        if (redis) {
            await redis.publish('potluck_updates', JSON.stringify({
                type: 'ORDER_PLACED',
                dealId: result.updatedDeal.id,
                currentOrderCount: result.updatedDeal.currentOrderCount,
                targetOrderCount: result.updatedDeal.targetOrderCount,
                status: result.updatedDeal.status
            }));
        }

        return NextResponse.json({ success: true, order: result.order });
    } catch (error: any) {
        logger.error("Failed to reserve potluck", { error: error.message });
        const message = error.message === "Deal not found" ? "Deal not found" :
                        error.message === "Deal is not active" ? "Deal is not active" :
                        error.message.startsWith("Only") ? error.message :
                        error.message.startsWith("You have already") ? error.message :
                        "Internal Server Error";
                        
        const status = message === "Internal Server Error" ? 500 : 400;
        return NextResponse.json({ error: message }, { status });
    }
}
