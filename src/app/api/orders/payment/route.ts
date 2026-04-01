import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { apiSuccess, apiUnauthorized, apiBadRequest, apiInternalError } from "@/lib/utils/api-response";
import { z } from "zod";

const paymentSchema = z.object({
    orderId: z.string().uuid("Invalid order ID"),
    paymentMethod: z.enum(["COD", "STRIPE"])
});

export async function POST(request: NextRequest) {
    try {
        const user = await getAuthUser(request);
        if (!user) return apiUnauthorized();

        const body = await request.json().catch(() => ({}));
        const parsed = paymentSchema.safeParse(body);

        if (!parsed.success) {
            return apiBadRequest("Invalid payment confirmation data", parsed.error.flatten().fieldErrors);
        }

        const { orderId, paymentMethod } = parsed.data;

        const order = await db.query.orders.findFirst({
            where: and(eq(orders.id, orderId), eq(orders.customerId, user.id))
        });

        if (!order) {
            return apiBadRequest("Order not found or access denied");
        }

        if (paymentMethod === "COD") {
            await db.update(orders)
                .set({ paymentMethod: "COD", paymentStatus: "PENDING", updatedAt: new Date() })
                .where(eq(orders.id, orderId));
            
            return apiSuccess({ method: "COD", message: "Pay on delivery confirmed" });
        }

        if (paymentMethod === "STRIPE") {
            if (!order.stripePaymentIntentId) {
                return apiBadRequest("No Stripe payment initiated for this order. Please use /api/orders/checkout instead or contact support.");
            }
            return apiSuccess({ method: "STRIPE", redirectUrl: null }); 
        }

        return apiBadRequest("Unsupported payment method");
    } catch (error) {
        console.error("[Payment Confirmation Error]", error);
        return apiInternalError("Failed to confirm payment status");
    }
}
