import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { reviews, kitchens } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { apiSuccess, apiUnauthorized, apiInternalError } from "@/lib/utils/api-response";

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthUser(request);
        if (!user) return apiUnauthorized();

        const userReviews = await db
            .select({
                id: reviews.id,
                rating: reviews.rating,
                comment: reviews.comment,
                sellerReply: reviews.sellerReply,
                createdAt: reviews.createdAt,
                kitchen: {
                    id: kitchens.id,
                    name: kitchens.name,
                },
            })
            .from(reviews)
            .innerJoin(kitchens, eq(reviews.kitchenId, kitchens.id))
            .where(eq(reviews.userId, user.id))
            .orderBy(desc(reviews.createdAt));

        return apiSuccess({ reviews: userReviews });
    } catch (error) {
        console.error("GET /api/account/reviews error:", error);
        return apiInternalError();
    }
}
