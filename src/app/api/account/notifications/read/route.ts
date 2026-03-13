import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { apiSuccess, apiUnauthorized, apiInternalError } from "@/lib/utils/api-response";

export async function PATCH(request: NextRequest) {
    try {
        const user = await getAuthUser(request);
        if (!user) return apiUnauthorized();

        await db
            .update(notifications)
            .set({ isRead: true })
            .where(and(
                eq(notifications.userId, user.id),
                eq(notifications.isRead, false)
            ));

        return apiSuccess({ message: "All notifications marked as read" });
    } catch (error) {
        console.error("PATCH /api/account/notifications/read error:", error);
        return apiInternalError();
    }
}
