import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { userFavorites, kitchens } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { apiSuccess, apiUnauthorized, apiInternalError, apiBadRequest } from "@/lib/utils/api-response";
import { z } from "zod";

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthUser(request);
        if (!user) return apiUnauthorized();

        const favorites = await db
            .select({
                favoriteId: userFavorites.id,
                createdAt: userFavorites.createdAt,
                kitchen: {
                    id: kitchens.id,
                    name: kitchens.name,
                    profileImageUrl: kitchens.profileImageUrl,
                    city: kitchens.city,
                    avgRating: kitchens.avgRating,
                    reviewCount: kitchens.reviewCount,
                },
            })
            .from(userFavorites)
            .innerJoin(kitchens, eq(userFavorites.kitchenId, kitchens.id))
            .where(eq(userFavorites.userId, user.id))
            .orderBy(desc(userFavorites.createdAt));

        return apiSuccess({ favorites });
    } catch (error) {
        console.error("GET /api/account/favorites error:", error);
        return apiInternalError();
    }
}

const addFavoriteSchema = z.object({
    kitchenId: z.string().uuid("Invalid kitchen ID format"),
});

export async function POST(request: NextRequest) {
    try {
        const user = await getAuthUser(request);
        if (!user) return apiUnauthorized();

        const body = await request.json().catch(() => ({}));
        const { kitchenId } = addFavoriteSchema.parse(body);

        // Verify kitchen exists
        const kitchen = await db.query.kitchens.findFirst({
            where: eq(kitchens.id, kitchenId),
            columns: { id: true },
        });

        if (!kitchen) return apiBadRequest("Kitchen not found");

        const [favorite] = await db
            .insert(userFavorites)
            .values({ userId: user.id, kitchenId })
            .onConflictDoNothing({ target: [userFavorites.userId, userFavorites.kitchenId] })
            .returning();

        return apiSuccess({ favorite, message: "Added to favorites" }, 201);
    } catch (error) {
        if (error instanceof z.ZodError) return apiBadRequest("Validation error", error.flatten().fieldErrors);
        console.error("POST /api/account/favorites error:", error);
        return apiInternalError();
    }
}
