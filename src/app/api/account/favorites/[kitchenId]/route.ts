import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { userFavorites } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { apiSuccess, apiUnauthorized, apiInternalError, apiNotFound } from "@/lib/utils/api-response";

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ kitchenId: string }> }
) {
    try {
        const { kitchenId } = await params;
        const user = await getAuthUser(request);
        if (!user) return apiUnauthorized();

        const [deleted] = await db
            .delete(userFavorites)
            .where(and(
                eq(userFavorites.userId, user.id),
                eq(userFavorites.kitchenId, kitchenId)
            ))
            .returning();

        if (!deleted) return apiNotFound("Favorite not found");

        return apiSuccess({ message: "Removed from favorites" });
    } catch (error) {
        console.error("DELETE /api/account/favorites/[kitchenId] error:", error);
        return apiInternalError();
    }
}
