import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { reviews } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { apiSuccess, apiUnauthorized, apiInternalError, apiNotFound, apiForbidden } from "@/lib/utils/api-response";

export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const params = await context.params;
        const reviewId = params.id;
        const user = await getAuthUser(request);
        if (!user) return apiUnauthorized();

        const review = await db.query.reviews.findFirst({
            where: eq(reviews.id, reviewId),
        });

        if (!review) return apiNotFound("Review not found");

        if (review.userId !== user.id && user.role !== "ADMIN") {
            return apiForbidden("You can only delete your own reviews");
        }

        await db.delete(reviews).where(eq(reviews.id, reviewId));

        return apiSuccess({ message: "Review deleted successfully" });
    } catch (error) {
        console.error("DELETE /api/reviews/[id] error:", error);
        return apiInternalError();
    }
}
