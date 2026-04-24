import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { notifications, adminAuditLog, users } from "@/lib/db/schema";
import { eq, and, lt, isNotNull } from "drizzle-orm";
import { apiSuccess, apiUnauthorized, apiInternalError } from "@/lib/utils/api-response";
import { timingSafeEqual } from "crypto";
import { redis } from "@/lib/redis";

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
    try {
        let cronSecret = request.headers.get("x-cron-secret");
        const authHeader = request.headers.get("authorization");
        if (!cronSecret && authHeader?.startsWith("Bearer ")) {
            cronSecret = authHeader.substring(7);
        }

        if (!CRON_SECRET || !cronSecret) {
            return apiUnauthorized("Missing cron secret");
        }

        const a = Buffer.from(cronSecret);
        const b = Buffer.from(process.env.CRON_SECRET ?? "");

        if (a.length !== b.length || !timingSafeEqual(a, b)) {
            return apiUnauthorized("Invalid cron secret");
        }

        // Redis Lock for idempotency
        if (redis) {
            const lock = await redis.set("cron:notification-cleanup:lock", "running", { ex: 300, nx: true });
            if (!lock) {
                return apiSuccess({ skipped: true, reason: "already running" });
            }
        }

        const startTime = Date.now();
        const now = new Date();

        try {
            // STEP 1 — Delete expired notifications
            const expiredDeleted = await db
                .delete(notifications)
                .where(lt(notifications.expiresAt, now))
                .returning({ id: notifications.id });

            // STEP 2 — Delete cleared notifications older than 24 hours (belt + suspenders)
            const clearedDateThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const clearedDeleted = await db
                .delete(notifications)
                .where(
                    and(
                        isNotNull(notifications.clearedAt),
                        lt(notifications.clearedAt, clearedDateThreshold)
                    )
                )
                .returning({ id: notifications.id });

            const totalDeleted = expiredDeleted.length + clearedDeleted.length;

            // STEP 3 — Log to admin_audit_log
            const adminUser = await db.query.users.findFirst({
                where: eq(users.role, "ADMIN"),
                columns: { id: true }
            });

            if (adminUser) {
                await db.insert(adminAuditLog).values({
                    adminId: adminUser.id,
                    action: "NOTIFICATION_CLEANUP",
                    targetType: "SYSTEM",
                    targetId: adminUser.id,
                    details: JSON.stringify({ deleted: totalDeleted, timestamp: now.toISOString() }),
                });
            }

            // STEP 4 — Return summary
            return apiSuccess({
                deleted: totalDeleted,
                executionMs: Date.now() - startTime,
            });
        } finally {
            if (redis) {
                await redis.del("cron:notification-cleanup:lock").catch(() => {});
            }
        }
    } catch (error) {
        console.error("[Cron Notification Cleanup Error]", error);
        return apiInternalError("Notification cleanup failed");
    }
}
