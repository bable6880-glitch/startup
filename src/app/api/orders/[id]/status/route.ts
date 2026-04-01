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

        // Update status
        const [updatedOrder] = await db
            .update(orders)
            .set({
                status,
                estimatedMinutes: estimatedMinutes || order.estimatedMinutes,
                acceptedAt: status === "ACCEPTED" ? new Date() : order.acceptedAt,
                completedAt: status === "COMPLETED" ? new Date() : order.completedAt,
                cancelledAt: status === "CANCELLED" ? new Date() : order.cancelledAt,
                updatedAt: new Date(),
            })
            .where(eq(orders.id, orderId))
            .returning();

        // N2: Notification on status change
        if (status === "ACCEPTED" || status === "COMPLETED") {
            const { notifyOrderAccepted, notifyOrderCompleted } = await import("@/services/notification.service");
            if (status === "ACCEPTED") {
                await notifyOrderAccepted(order.customerId, orderId, order.kitchen.name);
            } else {
                await notifyOrderCompleted(order.customerId, orderId, order.kitchen.name);
            }
        }

        return apiSuccess(updatedOrder);

    } catch (error) {
        console.error("[Update Order Status Error]", error);
        return apiInternalError();
    }
}
