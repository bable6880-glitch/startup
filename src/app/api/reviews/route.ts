import { NextRequest } from "next/server";
import { createKitchenReviewSchema, sellerReplySchema } from "@/lib/validations/review";
import { createKitchenReview, addSellerReply } from "@/services/review.service";
import {
    apiCreated,
    apiSuccess,
    apiBadRequest,
    apiUnauthorized,
    apiForbidden,
    apiConflict,
    apiTooManyRequests,
    apiInternalError,
} from "@/lib/utils/api-response";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { AppError } from "@/lib/utils/errors";
import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "@/lib/redis";

// Allow 5 requests per hour
const ratelimit = redis
    ? new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(5, "1 h"),
          analytics: true,
      })
    : null;

/**
 * POST /api/reviews
 * Auth required (CUSTOMER): Submit a review for a kitchen.
 */
export async function POST(request: NextRequest) {
    try {
        const user = await getAuthUser(request);
        if (!user) return apiUnauthorized();

        if (ratelimit) {
            const { success } = await ratelimit.limit(`rate_limit:review:${user.id}`);
            if (!success) {
                return apiTooManyRequests("Too many reviews. Please try again later.");
            }
        }

        const body = await request.json();
        const parsed = createKitchenReviewSchema.safeParse(body);

        if (!parsed.success) {
            const errors = parsed.error.flatten().fieldErrors as Record<string, string[]>;
            return apiBadRequest("Invalid review data", errors);
        }

        const review = await createKitchenReview(user.id, parsed.data);
        return apiCreated(review);
    } catch (error) {
        if (error instanceof AppError) {
            if (error.statusCode === 409) return apiConflict(error.message);
            if (error.statusCode === 403) return apiForbidden(error.message);
            return apiBadRequest(error.message);
        }
        console.error("[Create Review Error]", error);
        return apiInternalError("Failed to submit review");
    }
}

/**
 * PATCH /api/reviews
 * Auth required (COOK): Reply to a review on your kitchen.
 */
export async function PATCH(request: NextRequest) {
    try {
        const user = await getAuthUser(request);
        if (!user) return apiUnauthorized();

        const body = await request.json();
        const parsed = sellerReplySchema.safeParse(body);

        if (!parsed.success) {
            const errors = parsed.error.flatten().fieldErrors as Record<string, string[]>;
            return apiBadRequest("Invalid reply data", errors);
        }

        const updated = await addSellerReply(parsed.data.reviewId, user.id, parsed.data.reply);
        return apiSuccess(updated);
    } catch (error) {
        if (error instanceof AppError) {
            if (error.statusCode === 409) return apiConflict(error.message);
            if (error.statusCode === 403) return apiForbidden(error.message);
            return apiBadRequest(error.message);
        }
        console.error("[Seller Reply Error]", error);
        return apiInternalError("Failed to submit reply");
    }
}
