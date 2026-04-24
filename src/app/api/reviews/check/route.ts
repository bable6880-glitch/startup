import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { apiSuccess, apiBadRequest } from "@/lib/utils/api-response";
import { getAuthUser } from "@/lib/auth/get-auth-user";

/**
 * GET /api/reviews/check
 * Auth required (CUSTOMER): Check if the user is eligible to review a kitchen.
 * Multiple reviews per kitchen are allowed — only requires a completed order.
 */
export async function GET(request: NextRequest) {
    try {
        const user = await getAuthUser(request);
        if (!user) {
            return apiSuccess({ canReview: false, reason: "NOT_LOGGED_IN" });
        }

        const { searchParams } = new URL(request.url);
        const kitchenId = searchParams.get("kitchenId");

        if (!kitchenId) {
            return apiBadRequest("kitchenId is required");
        }

        // Check if a COMPLETED order exists (only requirement)
        const completedOrder = await db.query.orders.findFirst({
            where: and(
                eq(orders.customerId, user.id),
                eq(orders.kitchenId, kitchenId),
                eq(orders.status, "COMPLETED")
            ),
            orderBy: (orders, { desc }) => [desc(orders.completedAt)],
        });

        if (!completedOrder) {
            return apiSuccess({
                canReview: false,
                reason: "NO_COMPLETED_ORDER",
            });
        }

        return apiSuccess({
            canReview: true,
            orderId: completedOrder.id,
        });
    } catch (error) {
        console.error("[Check Review Eligibility Error]", error);
        return apiSuccess({ canReview: false }); // Fallback graceful degradation
    }
}
