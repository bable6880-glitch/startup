import { NextRequest } from "next/server";
import { apiSuccess, apiUnauthorized, apiNotFound, apiForbidden, apiBadRequest, apiInternalError } from "@/lib/utils/api-response";
import { requireSeller } from "@/lib/auth/seller-guard";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { updateOrderStatusSchema } from "@/lib/validations/order";

export async function PATCH(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const orderId = params.id;
        const body = await request.json();

        const parsed = updateOrderStatusSchema.safeParse(body);
        if (!parsed.success) {
            return apiBadRequest("Invalid status data");
        }

        const { status, estimatedMinutes } = parsed.data;

        // Get order to verify ownership
        const order = await db.query.orders.findFirst({
            where: eq(orders.id, orderId),
            with: {
                kitchen: true,
            },
        });

        if (!order) {
            return apiNotFound("Order not found");
        }

        const guard = await requireSeller(request, order.kitchenId);
        if (!guard.ok) return guard.response;

        const { updateOrderStatus } = await import("@/services/order.service");
        const updatedOrder = await updateOrderStatus(orderId, guard.user.id, parsed.data);

        // N2: Notification on status change (Email/Push notifications decoupled from SSE)
        if (status === "ACCEPTED" || status === "COMPLETED") {
            const { notifyOrderAccepted, notifyOrderCompleted } = await import("@/services/notification.service");
            if (status === "ACCEPTED") {
                await notifyOrderAccepted(order.customerId, orderId, order.kitchen.name);
            } else {
                await notifyOrderCompleted(order.customerId, orderId, order.kitchen.name);

                // Record commission + increment order count on COMPLETED
                try {
                    const { recordCommission } = await import("@/services/commission.service");
                    const orderAmount = order.totalAmount ? Number(order.totalAmount) : 0;
                    if (orderAmount > 0) {
                        await recordCommission(orderId, order.kitchenId, guard.user.id, orderAmount);
                    }
                } catch (commErr) {
                    console.error("[Commission Recording Error]", commErr);
                    // Don't fail the status update if commission recording fails
                }
            }
        }

        return apiSuccess(updatedOrder);

    } catch (error) {
        console.error("[Update Order Status Error]", error);
        return apiInternalError();
    }
}
