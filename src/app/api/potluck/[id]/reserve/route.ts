import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { potluckDeals, potluckOrders, orders, orderItems, meals, users, kitchens } from "@/lib/db/schema";
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

        // Fetch user snapshot details
        const customer = await db.query.users.findFirst({
            where: eq(users.id, user.id),
            columns: { name: true, phone: true, defaultAddress: true },
        });

        // Get Kitchen details to check lock
        const dealDetails = await db.query.potluckDeals.findFirst({
            where: eq(potluckDeals.id, dealId)
        });

        if (!dealDetails || dealDetails.status !== 'ACTIVE' || new Date() > new Date(dealDetails.expiresAt)) {
             return NextResponse.json(
                { error: "Deal is full, expired, or no longer active" },
                { status: 409 }
            );
        }

        const kitchen = await db.query.kitchens.findFirst({
            where: eq(kitchens.id, dealDetails.kitchenId)
        });

        if (kitchen?.isLocked) {
             return NextResponse.json(
                { error: "This kitchen is temporarily not accepting orders." },
                { status: 423 }
            );
        }

        // ATOMIC OPERATION: Single UPDATE with WHERE guard — prevents overselling
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
            .returning();

        if (result.length === 0) {
            return NextResponse.json(
                { error: "Deal is full, expired, or no longer active" },
                { status: 409 }
            );
        }

        const updatedDeal = result[0];
        const pricePerPlate = Number(updatedDeal.pricePerPlateRs);
        const totalAmountRs = pricePerPlate * quantity;

        const mealId = updatedDeal.mealId;
        if (!mealId) {
             return NextResponse.json(
                { error: "System Error: Potluck deal is missing a meal linkage." },
                { status: 500 }
            );
        }

        // 1. Create standard Order
        const [mainOrder] = await db.insert(orders).values({
            kitchenId: updatedDeal.kitchenId,
            customerId: user.id,
            status: "PENDING",
            totalAmount: totalAmountRs,
            currency: "PKR",
            notes: body.notes || `Potluck Order: ${updatedDeal.title}`,
            deliveryMode: "SELF_PICKUP", // Default for potluck unless specified
            customerName: customer?.name || user.name,
            customerPhone: customer?.phone || "",
            deliveryAddress: customer?.defaultAddress || "",
            paymentMethod: "COD",
        }).returning();

        // 2. Create Order Item
        await db.insert(orderItems).values({
            orderId: mainOrder.id,
            mealId: mealId,
            quantity: quantity,
            priceAtOrder: pricePerPlate,
            notes: body.notes,
        });

        // 3. Create Potluck Reservation Link
        const [potluckOrder] = await db.insert(potluckOrders).values({
            potluckDealId: dealId,
            customerId: user.id,
            orderId: mainOrder.id,
            quantity,
            totalAmountRs: totalAmountRs.toString(),
            status: 'RESERVED',
        }).returning();

        // Real-time: notify cook dashboard using standard NEW_ORDER
        try {
            await publishEvent(CHANNELS.kitchenOrders(updatedDeal.kitchenId), {
                type: "NEW_ORDER",
                payload: {
                    orderId: mainOrder.id,
                    items: [{ mealId, quantity, price: pricePerPlate }],
                    totalAmount: totalAmountRs,
                    currency: "PKR",
                    notes: mainOrder.notes || "",
                    status: "PENDING",
                    placedAt: new Date().toISOString(),
                    customerName: mainOrder.customerName,
                    customerPhone: mainOrder.customerPhone,
                    deliveryAddress: mainOrder.deliveryAddress,
                },
            });
            
            // Also send the potluck progress update
            await publishEvent(CHANNELS.kitchenOrders(updatedDeal.kitchenId), {
                type: 'POTLUCK_UPDATE',
                payload: {
                    dealId,
                    currentCount: updatedDeal.currentOrderCount,
                    targetCount: updatedDeal.targetOrderCount,
                    status: updatedDeal.status,
                },
            });
        } catch (e) {
            logger.error("Failed to publish potluck event", { error: e });
        }

        // Send notification
        try {
            const { notifyOrderPlaced } = await import("@/services/notification.service");
            if (kitchen?.ownerId) {
                await notifyOrderPlaced(kitchen.ownerId, mainOrder.id, user.name || "A customer");
            }
        } catch (e) {}

        return NextResponse.json({
            success: true,
            order: potluckOrder,
            mainOrderId: mainOrder.id,
            deal: {
                currentOrderCount: updatedDeal.currentOrderCount,
                targetOrderCount: updatedDeal.targetOrderCount,
                status: updatedDeal.status,
            },
        });
    } catch (error: any) {
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
