import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { db } from "@/lib/db";
import { kitchens, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
    apiSuccess,
    apiBadRequest,
    apiUnauthorized,
    apiInternalError,
    apiNotFound,
} from "@/lib/utils/api-response";

/**
 * PATCH /api/kitchen/update-images
 * Updates the user's avatar URL or the specific kitchen's profile/cover image fields.
 * Payload: { type: 'avatar' | 'cover', url: string }
 */
export async function PATCH(request: NextRequest) {
    try {
        const user = await getAuthUser(request);
        if (!user || (user.role !== "COOK" && user.role !== "ADMIN")) {
            return apiUnauthorized("Only authorized cooks can modify images");
        }

        const body = await request.json();
        const { type, url } = body;

        if (!type || !url) {
            return apiBadRequest("Missing required payload parameters: 'type' or 'url'");
        }

        // Validate URL protocol injection
        if (!url.startsWith("https://res.cloudinary.com/")) {
            return apiBadRequest("Database integrity failure: URL origin prohibited");
        }

        if (type === "avatar") {
            // Updating the Kitchen's specific profileImageUrl
            // First we must find the cook's kitchen
            const kitchenRecord = await db.query.kitchens.findFirst({
                where: eq(kitchens.ownerId, user.id),
            });

            if (!kitchenRecord) return apiNotFound("Kitchen record not found");

            await db.update(kitchens)
                .set({ profileImageUrl: url, updatedAt: new Date() })
                .where(eq(kitchens.id, kitchenRecord.id));

            // Sync user avatar gracefully if they don't have one globally
            await db.update(users)
                .set({ avatarUrl: url, updatedAt: new Date() })
                .where(eq(users.id, user.id));

            return apiSuccess({ message: "Avatar securely tied to database", url });

        } else if (type === "cover") {
            // Updating the Kitchen's cover background
            const kitchenRecord = await db.query.kitchens.findFirst({
                where: eq(kitchens.ownerId, user.id),
            });

            if (!kitchenRecord) return apiNotFound("Kitchen record not found");

            await db.update(kitchens)
                .set({ coverImageUrl: url, updatedAt: new Date() })
                .where(eq(kitchens.id, kitchenRecord.id));

            return apiSuccess({ message: "Background Cover securely tied to database", url });
            
        } else {
            return apiBadRequest("Invalid type specificator mappings");
        }

    } catch (error) {
        console.error("Database Update Failed during Image Syncs:", error);
        return apiInternalError("Database mapping sync failed");
    }
}
