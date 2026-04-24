import { NextRequest } from "next/server";
import { apiSuccess, apiUnauthorized } from "@/lib/utils/api-response";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { and, eq, isNull } from "drizzle-orm";

export async function POST(request: NextRequest) {
    const user = await getAuthUser(request);
    if (!user) return apiUnauthorized();

    await db
        .update(notifications)
        .set({ isRead: true })
        .where(
            and(
                eq(notifications.userId, user.id),
                eq(notifications.isRead, false),
                isNull(notifications.clearedAt)
            )
        );

    return apiSuccess({ message: "All marked as read" });
}
