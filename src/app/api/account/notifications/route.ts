import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { apiPaginated, apiUnauthorized, apiInternalError } from "@/lib/utils/api-response";

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthUser(request);
        if (!user) return apiUnauthorized();

        const { searchParams } = new URL(request.url);
        const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
        const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));
        const offset = (page - 1) * limit;

        const data = await db.query.notifications.findMany({
            where: eq(notifications.userId, user.id),
            orderBy: [desc(notifications.createdAt)],
            limit,
            offset,
        });

        const [{ value: total }] = await db
            .select({ value: db.$count(notifications, eq(notifications.userId, user.id)) })
            .from(notifications);

        return apiPaginated(data, { page, limit, total: Number(total) });
    } catch (error) {
        console.error("GET /api/account/notifications error:", error);
        return apiInternalError();
    }
}
