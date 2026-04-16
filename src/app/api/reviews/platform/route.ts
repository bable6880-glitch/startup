import { NextRequest, NextResponse } from "next/server";
import { createPlatformReviewSchema } from "@/lib/validations/review";
import { createPlatformReview, getPlatformReviewStats } from "@/services/review.service";
import {
    apiCreated,
    apiSuccess,
    apiBadRequest,
    apiUnauthorized,
    apiConflict,
    apiInternalError,
} from "@/lib/utils/api-response";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { AppError } from "@/lib/utils/errors";
import { cached } from "@/lib/redis";

/**
 * POST /api/reviews/platform
 * Auth required (CUSTOMER): Submit a platform review.
 */
export async function POST(request: NextRequest) {
    try {
        const user = await getAuthUser(request);
        if (!user) return apiUnauthorized();

        const body = await request.json();
        const parsed = createPlatformReviewSchema.safeParse(body);

        if (!parsed.success) {
            const errors = parsed.error.flatten().fieldErrors as Record<string, string[]>;
            return apiBadRequest("Invalid review data", errors);
        }

        const review = await createPlatformReview(user.id, parsed.data);
        return apiCreated(review);
    } catch (error) {
        if (error instanceof AppError) {
            if (error.statusCode === 409) return apiConflict(error.message);
            return apiBadRequest(error.message);
        }
        console.error("[Create Platform Review Error]", error);
        return apiInternalError("Failed to submit review");
    }
}

/**
 * GET /api/reviews/platform
 * No auth: Get platform review stats.
 */
export async function GET() {
    try {
        const stats = await cached(
            'platform:review:stats',
            600, // 10 minutes TTL
            async () => getPlatformReviewStats()
        );
        return apiSuccess(stats);
    } catch (error) {
        console.error("[Get Platform Review Stats Error]", error);
        return apiInternalError("Failed to fetch platform review stats");
    }
}
