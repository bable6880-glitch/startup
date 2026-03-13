import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { apiSuccess, apiUnauthorized, apiInternalError, apiNotFound } from "@/lib/utils/api-response";

export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const params = await context.params;
        const notificationId = params.id;
        const user = await getAuthUser(request);
        if (!user) return apiUnauthorized();

        const [updated] = await db
            .update(notifications)
            .set({ isRead: true })
            .where(and(
                eq(notifications.id, notificationId),
                eq(notifications.userId, user.id)
            ))
            .returning();

        if (!updated) return apiNotFound("Notification not found");

        return apiSuccess({ notification: updated });
    } catch (error) {
        console.error("PATCH /api/account/notifications/[id]/read error:", error);
        return apiInternalError();
    }
}
