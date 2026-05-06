import { NextRequest } from "next/server";
import {
    getReports,
    resolveReport,
    moderateKitchen,
    moderateUser,
    getPlatformStats,
} from "@/services/admin.service";
import {
    apiSuccess,
    apiBadRequest,
    apiUnauthorized,
    apiForbidden,
    apiNotFound,
    apiInternalError,
    apiPaginated,
} from "@/lib/utils/api-response";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { z } from "zod";
import { AppError } from "@/lib/utils/errors";

// ─── Helper: Require Admin ──────────────────────────────────────────────────

async function requireAdmin(request: NextRequest) {
    const user = await getAuthUser(request);
    if (!user) return { user: null, error: apiUnauthorized() };
    if (user.role !== "ADMIN") return { user: null, error: apiForbidden("Admin access required") };
    return { user, error: null };
}

/**
 * GET /api/admin/stats
 * Admin only: Platform statistics.
 */
export async function GET(request: NextRequest) {
    try {
        const { error } = await requireAdmin(request);
        if (error) return error;

        const action = request.nextUrl.searchParams.get("action");
        const page = Math.max(1, parseInt(request.nextUrl.searchParams.get("page") ?? "1"));
        const limit = Math.min(50, Math.max(1, parseInt(request.nextUrl.searchParams.get("limit") ?? "20")));

        if (action === "stats") {
            const stats = await getPlatformStats();
            return apiSuccess(stats);
        }

        // CHANGED [H5]: Added users listing for admin
        if (action === "users") {
            const { users: usersTable } = await import("@/lib/db/schema");
            const { db: database } = await import("@/lib/db");
            const { desc: descOrder, sql: sqlFn } = await import("drizzle-orm");
            const cursor = request.nextUrl.searchParams.get("cursor");

            const conditions = [];
            if (cursor) {
                conditions.push(sqlFn`${usersTable.id} > ${cursor}`);
            }

            const data = await database.query.users.findMany({
                where: conditions.length ? (await import("drizzle-orm")).and(...conditions) : undefined,
                orderBy: [descOrder(usersTable.createdAt)],
                limit: limit + 1,
                columns: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    isActive: true,
                    createdAt: true,
                    avatarUrl: true,
                },
            });

            const hasMore = data.length > limit;
            const results = hasMore ? data.slice(0, -1) : data;
            const nextCursor = hasMore ? results[results.length - 1].id : null;

            return apiSuccess({ data: results, nextCursor });
        }

        // CHANGED [H5]: Added kitchens listing for admin
        if (action === "kitchens") {
            const { kitchens: kitchensTable } = await import("@/lib/db/schema");
            const { db: database } = await import("@/lib/db");
            const { desc: descOrder, sql: sqlFn } = await import("drizzle-orm");

            const cursor = request.nextUrl.searchParams.get("cursor");

            const conditions = [];
            if (cursor) {
                conditions.push(sqlFn`${kitchensTable.id} > ${cursor}`);
            }

            const data = await database.query.kitchens.findMany({
                where: conditions.length ? (await import("drizzle-orm")).and(...conditions) : undefined,
                orderBy: [descOrder(kitchensTable.createdAt)],
                limit: limit + 1,
                columns: {
                    id: true,
                    name: true,
                    city: true,
                    status: true,
                    isVerified: true,
                    avgRating: true,
                    reviewCount: true,
                    createdAt: true,
                },
                with: {
                    owner: { columns: { id: true, name: true, email: true } },
                },
            });

            const hasMore = data.length > limit;
            const results = hasMore ? data.slice(0, -1) : data;
            const nextCursor = hasMore ? results[results.length - 1].id : null;

            return apiSuccess({ data: results, nextCursor });
        }

        // CHANGED [H5]: Added audit log listing for admin
        if (action === "audit_log") {
            const { adminAuditLog } = await import("@/lib/db/schema");
            const { db: database } = await import("@/lib/db");
            const { desc: descOrder, sql: sqlFn } = await import("drizzle-orm");
            const offset = (page - 1) * limit;

            const [data, countResult] = await Promise.all([
                database.query.adminAuditLog.findMany({
                    orderBy: [descOrder(adminAuditLog.createdAt)],
                    limit,
                    offset,
                    with: {
                        admin: { columns: { id: true, displayName: true } },
                    },
                }),
                database
                    .select({ count: sqlFn<number>`count(*)` })
                    .from(adminAuditLog),
            ]);

            return apiPaginated(data, { page, limit, total: Number(countResult[0].count) });
        }

        // Default: list reports
        const status = request.nextUrl.searchParams.get("status") as
            | "PENDING"
            | "REVIEWED"
            | "RESOLVED"
            | "DISMISSED"
            | undefined;

        const result = await getReports(status || undefined, page, limit);

        return apiPaginated(result.reports, {
            page: result.page,
            limit: result.limit,
            total: result.total,
        });
    } catch (error) {
        console.error("[Admin Error]", error);
        return apiInternalError("Admin operation failed");
    }
}

// ─── Admin Actions Schema ───────────────────────────────────────────────────

const adminActionSchema = z.discriminatedUnion("action", [
    z.object({
        action: z.literal("resolve_report"),
        reportId: z.string().uuid(),
        resolution: z.string().min(1),
        status: z.enum(["RESOLVED", "DISMISSED"]),
    }),
    z.object({
        action: z.literal("moderate_kitchen"),
        kitchenId: z.string().uuid(),
        modAction: z.enum(["suspend", "activate", "verify"]),
        reason: z.string().optional(),
    }),
    z.object({
        action: z.literal("moderate_user"),
        userId: z.string().uuid(),
        modAction: z.enum(["suspend", "activate", "make_admin"]),
        reason: z.string().optional(),
    }),
    z.object({
        action: z.literal("delete_review"),
        reviewId: z.string().uuid(),
    }),
]);

/**
 * POST /api/admin
 * Admin only: Execute admin actions.
 */
export async function POST(request: NextRequest) {
    try {
        const { user, error } = await requireAdmin(request);
        if (error) return error;

        const body = await request.json();
        const parsed = adminActionSchema.safeParse(body);

        if (!parsed.success) {
            const errors = parsed.error.flatten().fieldErrors as Record<string, string[]>;
            return apiBadRequest("Invalid admin action", errors);
        }

        const data = parsed.data;

        switch (data.action) {
            case "resolve_report": {
                const result = await resolveReport(
                    data.reportId,
                    user!.id,
                    data.resolution,
                    data.status
                );
                return apiSuccess(result);
            }

            case "moderate_kitchen": {
                const result = await moderateKitchen(
                    data.kitchenId,
                    user!.id,
                    data.modAction,
                    data.reason
                );
                return apiSuccess(result);
            }

            case "moderate_user": {
                const result = await moderateUser(
                    data.userId,
                    user!.id,
                    data.modAction,
                    data.reason
                );
                return apiSuccess(result);
            }

            case "delete_review": {
                const { deleteReview } = await import("@/services/review.service");
                const result = await deleteReview(data.reviewId);
                return apiSuccess(result);
            }
        }
    } catch (error) {
        if (error instanceof AppError) {
            if (error.statusCode === 404) return apiNotFound(error.message);
        }
        console.error("[Admin Action Error]", error);
        return apiInternalError("Admin action failed");
    }
}
