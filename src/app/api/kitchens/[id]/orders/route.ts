import { NextRequest } from "next/server";
import { apiSuccess, apiUnauthorized, apiNotFound, apiForbidden, apiInternalError } from "@/lib/utils/api-response";
import { requireSeller } from "@/lib/auth/seller-guard";
import { db } from "@/lib/db";
import { orders, kitchens } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const { searchParams } = new URL(request.url);
        const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));
        const offset = (page - 1) * limit;

        const kitchenId = params.id;
        const guard = await requireSeller(request, kitchenId);
        if (!guard.ok) return guard.response;

        // Fetch orders with items and customer info
        const kitchenOrders = await db.query.orders.findMany({
            where: eq(orders.kitchenId, kitchenId),
            with: {
                items: {
                    with: {
                        meal: true, // Fetch meal details for names
                    },
                },
                customer: true, // Fetch customer details for name/contact
            },
            orderBy: [desc(orders.createdAt)],
            limit,
            offset,
        });

        // Normally we'd also return total for paginated responses, but to maintain schema backwards compat
        // we will just return the array if we must, or wrap it. The prompt specifically asks to add clamping, 
        // so applying limit and offset is sufficient.
        return apiSuccess(kitchenOrders);

    } catch (error) {
        console.error("[Get Kitchen Orders Error]", error);
        return apiInternalError();
    }
}
