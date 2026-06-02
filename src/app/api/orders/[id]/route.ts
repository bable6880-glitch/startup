import { NextRequest } from "next/server";
import { apiSuccess, apiUnauthorized, apiNotFound, apiForbidden, apiInternalError, apiBadRequest } from "@/lib/utils/api-response";
import { z } from "zod";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const user = await getAuthUser(request);
        if (!user) {
            return apiUnauthorized();
        }

        const orderId = params.id;

        const order = await db.query.orders.findFirst({
            where: eq(orders.id, orderId),
            with: {
                kitchen: true,
                items: {
                    with: {
                        meal: true,
                    },
                },
                customer: true,
            },
        });

        if (!order) {
            return apiNotFound("Order not found");
        }

        // Access control: Only customer or kitchen owner/admin can view
        const isCustomer = order.customerId === user.id;
        const isOwner = order.kitchen.ownerId === user.id;

        if (!isCustomer && !isOwner && user.role !== "ADMIN") {
            return apiForbidden();
        }

        return apiSuccess(order);

    } catch (error) {
        console.error("[Get Order Error]", error);
        return apiInternalError();
    }
}

export async function PATCH(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const user = await getAuthUser(request);
        if (!user) return apiUnauthorized();

        const orderId = params.id;
        if (!orderId) return apiBadRequest('Order ID required');

        const body = await request.json();

        // Validate with Zod
        const updateOrderSchema = z.object({
            status: z.enum(['ACCEPTED', 'COMPLETED', 'CANCELLED']),
        });

        const parsed = updateOrderSchema.safeParse(body);
        if (!parsed.success) {
            return apiBadRequest('Invalid status', parsed.error.flatten().fieldErrors);
        }

        const { status } = parsed.data;

        // Delegate to service (business logic lives there)
        const { updateOrderStatus } = await import('@/services/order.service');
        const updated = await updateOrderStatus(orderId, user.id, { status });

        return apiSuccess(updated);
    } catch (error: unknown) {
        if (error instanceof Error && error.message === 'UNAUTHORIZED') {
            return apiForbidden('You do not own this order');
        }
        console.error('[PATCH /api/orders/[id]]', error);
        return apiInternalError('Failed to update order');
    }
}
