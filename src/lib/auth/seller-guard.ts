import { NextRequest } from "next/server";
import { getAuthUser, type AuthUser } from "@/lib/auth/get-auth-user";
import { db } from "@/lib/db";
import { kitchens } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
    apiUnauthorized,
    apiForbidden,
    apiNotFound,
} from "@/lib/utils/api-response";

type Kitchen = typeof kitchens.$inferSelect;

type SellerGuardSuccess = {
    ok: true;
    user: AuthUser;
    kitchen: Kitchen;
};

type SellerGuardFailure = {
    ok: false;
    response: ReturnType<typeof apiUnauthorized>;
};

export type SellerGuardResult = SellerGuardSuccess | SellerGuardFailure;

/**
 * Verifies that the request is from an authenticated COOK user
 * and loads their kitchen. Returns the user + kitchen or an error response.
 *
 * Usage:
 *   const guard = await requireSeller(request);
 *   if (!guard.ok) return guard.response;
 *   const { user, kitchen } = guard;
 */
export async function requireSeller(
    request: NextRequest,
    targetKitchenId?: string
): Promise<SellerGuardResult> {
    const user = await getAuthUser(request);
    if (!user) {
        return { ok: false, response: apiUnauthorized() };
    }

    if (user.role !== "COOK" && user.role !== "ADMIN") {
        return {
            ok: false,
            response: apiForbidden("Only sellers can access this resource"),
        };
    }

    const kitchen = await db.query.kitchens.findFirst({
        where: eq(kitchens.ownerId, user.id),
    });

    if (!kitchen) {
        return {
            ok: false,
            response: apiNotFound("No kitchen found. Please register your kitchen first."),
        };
    }

    if (targetKitchenId && kitchen.id !== targetKitchenId) {
        return {
            ok: false,
            response: apiForbidden("You do not have permission to modify this kitchen"),
        };
    }

    return { ok: true, user, kitchen };
}
