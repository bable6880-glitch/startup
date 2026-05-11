import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { potluckDeals, potluckOrders } from "@/lib/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { logger } from "@/lib/utils/logger";
import { publishEvent, CHANNELS } from "@/lib/redis/pubsub";
import { getAuthUser } from "@/lib/auth/get-auth-user";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getAuthUser(req);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { id: dealId } = await params;
        const body = await req.json();
        const quantity = Math.max(1, Math.min(10, Number(body.quantity) || 1));

        // Check if user already reserved
        const existingOrder = await db.query.potluckOrders.findFirst({
            where: and(
                eq(potluckOrders.potluckDealId, dealId),
                eq(potluckOrders.customerId, user.id)
            ),
        });

        if (existingOrder) {
            return NextResponse.json(
                { error: "You have already reserved plates for this deal" },
                { status: 409 }
            );
        }

        // ATOMIC OPERATION: Single UPDATE with WHERE guard — prevents overselling
        // neon-http does NOT support db.transaction(), so this MUST be a single SQL
        const result = await db.update(potluckDeals)
            .set({
                currentOrderCount: sql`${potluckDeals.currentOrderCount} + ${quantity}`,
                status: sql`CASE
                    WHEN ${potluckDeals.currentOrderCount} + ${quantity} >= ${potluckDeals.targetOrderCount}
                    THEN 'FILLED'::potluck_status_enum
                    ELSE ${potluckDeals.status}
                END`,
                activatedAt: sql`CASE
                    WHEN ${potluckDeals.currentOrderCount} + ${quantity} >= ${potluckDeals.targetOrderCount}
                    THEN NOW()
                    ELSE ${potluckDeals.activatedAt}
                END`,
                updatedAt: new Date(),
            })
            .where(
                sql`${potluckDeals.id} = ${dealId}
                    AND ${potluckDeals.currentOrderCount} + ${quantity} <= ${potluckDeals.totalPlatesAvailable}
                    AND ${potluckDeals.status} = 'ACTIVE'
                    AND ${potluckDeals.expiresAt} > NOW()`
            )
            .returning({
                id: potluckDeals.id,
                currentOrderCount: potluckDeals.currentOrderCount,
                targetOrderCount: potluckDeals.targetOrderCount,
                status: potluckDeals.status,
                pricePerPlateRs: potluckDeals.pricePerPlateRs,
                kitchenId: potluckDeals.kitchenId,
            });

        if (result.length === 0) {
            return NextResponse.json(
                { error: "Deal is full, expired, or no longer active" },
                { status: 409 }
            );
        }

        const updatedDeal = result[0];
        const totalAmountRs = Number(updatedDeal.pricePerPlateRs) * quantity;

        // Insert reservation (compensation: if this fails, the count was already incremented
        // but the user has no order — acceptable edge case for neon-http without transactions)
        const [order] = await db.insert(potluckOrders).values({
            potluckDealId: dealId,
            customerId: user.id,
            quantity,
            totalAmountRs: totalAmountRs.toString(),
            status: 'RESERVED',
        }).returning();

        logger.info("Potluck reservation created", {
            dealId,
            customerId: user.id,
            quantity,
            newCount: updatedDeal.currentOrderCount,
            status: updatedDeal.status,
        });

        // Publish real-time update through existing kitchen SSE channel
        // No separate /api/potluck/sse endpoint needed — prevents Vercel 300s timeouts
        if (updatedDeal.kitchenId) {
            await publishEvent(CHANNELS.kitchenOrders(updatedDeal.kitchenId), {
                type: 'POTLUCK_UPDATE',
                payload: {
                    dealId,
                    currentCount: updatedDeal.currentOrderCount,
                    targetCount: updatedDeal.targetOrderCount,
                    status: updatedDeal.status,
                },
            });
        }

        // If deal just became FILLED, log it (order creation for all reservations
        // would need a separate background job in production)
        if (updatedDeal.status === 'FILLED') {
            logger.info("Potluck deal FILLED", {
                dealId,
                finalCount: updatedDeal.currentOrderCount,
                target: updatedDeal.targetOrderCount,
            });
        }

        return NextResponse.json({
            success: true,
            order,
            deal: {
                currentOrderCount: updatedDeal.currentOrderCount,
                targetOrderCount: updatedDeal.targetOrderCount,
                status: updatedDeal.status,
            },
        });
    } catch (error: any) {
        // Handle unique constraint violation (duplicate reservation)
        if (error?.code === '23505') {
            return NextResponse.json(
                { error: "You have already reserved plates for this deal" },
                { status: 409 }
            );
        }
        logger.error("Failed to reserve potluck", { error: error?.message });
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
