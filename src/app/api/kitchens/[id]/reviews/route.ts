import { NextRequest } from "next/server";
import { reviewQuerySchema } from "@/lib/validations/review";
import { getKitchenReviews } from "@/services/review.service";
import {
    apiPaginated,
    apiBadRequest,
    apiInternalError,
} from "@/lib/utils/api-response";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/kitchens/[id]/reviews
 * Public: Get reviews for a kitchen (paginated).
 */
export async function GET(request: NextRequest, { params }: Params) {
    try {
        const { id } = await params;
        const queryParams = Object.fromEntries(request.nextUrl.searchParams);
        const parsed = reviewQuerySchema.safeParse(queryParams);

        if (!parsed.success) {
            const errors = parsed.error.flatten().fieldErrors as Record<string, string[]>;
            return apiBadRequest("Invalid query parameters", errors);
        }

        const result = await getKitchenReviews(id, {
            ...parsed.data,
            page: Math.max(1, parseInt(queryParams.page ?? "1")),
            limit: Math.min(50, Math.max(1, parseInt(queryParams.limit ?? "20"))),
        });

        return apiPaginated(result.reviews, {
            page: result.page,
            limit: result.limit,
            total: result.total,
        });
    } catch (error) {
        console.error("[List Reviews Error]", error);
        return apiInternalError("Failed to fetch reviews");
    }
}
