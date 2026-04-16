import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { meals } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { apiSuccess, apiUnauthorized, apiInternalError } from "@/lib/utils/api-response";
import { timingSafeEqual } from "crypto";
import { invalidateCache, CacheKeys } from "@/lib/redis";

// Phase B: Daily Menu Reset
// Call via Vercel Cron: GET /api/cron/reset-menu
// Secured by CRON_SECRET environment variable.

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
    try {
        // Auth: check Bearer token or x-cron-secret
        let cronSecret = request.headers.get("x-cron-secret");
        const authHeader = request.headers.get("authorization");
        if (!cronSecret && authHeader?.startsWith("Bearer ")) {
            cronSecret = authHeader.substring(7);
        }

        if (!CRON_SECRET || !cronSecret) {
            return apiUnauthorized("Missing cron secret");
        }

        // Timing-safe comparison to prevent timing attacks
        const a = Buffer.from(cronSecret);
        const b = Buffer.from(process.env.CRON_SECRET ?? "");

        if (a.length !== b.length || !timingSafeEqual(a, b)) {
            return apiUnauthorized("Invalid cron secret");
        }

        const now = new Date();

        // 1. Find which kitchens will be affected so we can invalidate their caches
        const affectedMeals = await db
            .select({ kitchenId: meals.kitchenId })
            .from(meals)
            .where(eq(meals.availabilityStatus, "NOT_TODAY"));

        const kitchenIds = Array.from(new Set(affectedMeals.map(m => m.kitchenId)));

        if (kitchenIds.length === 0) {
            return apiSuccess({ message: "No meals to reset", resetCount: 0 });
        }

        // 2. Perform the reset update
        const updatedMeals = await db
            .update(meals)
            .set({ 
                availabilityStatus: "AVAILABLE", 
                isAvailable: true,
                updatedAt: now 
            })
            .where(eq(meals.availabilityStatus, "NOT_TODAY"))
            .returning({ id: meals.id });

        // 3. Clear cache for the affected kitchens
        for (const kitchenId of kitchenIds) {
            await invalidateCache(CacheKeys.kitchenMenu(kitchenId));
        }

        return apiSuccess({
            message: "Menu reset complete",
            resetCount: updatedMeals.length,
            affectedKitchens: kitchenIds.length,
            timestamp: now.toISOString(),
        });
    } catch (error) {
        console.error("[Cron Reset Menu Error]", error);
        return apiInternalError("Cron reset menu failed");
    }
}
