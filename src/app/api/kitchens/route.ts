// CHANGED: POST handler now performs sequential kitchen insert + role update
// with compensation logic (delete kitchen if role update fails).
// Role is returned in response so client can update local state.

import { NextRequest } from "next/server";
import { createHash } from "crypto";
import { createKitchenSchema, kitchenQuerySchema } from "@/lib/validations/kitchen";
import { createKitchen, listKitchens, getKitchensByOwner } from "@/services/kitchen.service";
import { updateUserRole } from "@/services/auth.service";
import { setUserRoleClaim } from "@/lib/auth/firebase-admin";
import { db } from "@/lib/db";
import { kitchens } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { haversineKm } from "@/lib/utils/distance";
import {
    apiSuccess,
    apiCreated,
    apiBadRequest,
    apiUnauthorized,
    apiInternalError,
    apiPaginated,
} from "@/lib/utils/api-response";
import { getAuthUser } from "@/lib/auth/get-auth-user";

/**
 * OPTIONS /api/kitchens
 * Handle CORS preflight requests (required for Amplify + cross-origin clients)
 */
export async function OPTIONS() {
    return new Response(null, {
        status: 204,
        headers: {
            "Access-Control-Allow-Origin": process.env.NEXT_PUBLIC_BASE_URL || "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Max-Age": "86400",
        },
    });
}

/**
 * GET /api/kitchens
 * Public: Browse kitchens with filters.
 * Special: ?ownerId=me returns the authenticated user's kitchen(s).
 */
export async function GET(request: NextRequest) {
    try {
        const params = Object.fromEntries(request.nextUrl.searchParams);

        // Handle ownerId=me — return the authenticated user's kitchen(s)
        if (params.ownerId === "me") {
            const user = await getAuthUser(request);
            if (!user) return apiUnauthorized();

            const userKitchens = await getKitchensByOwner(user.id);
            return apiSuccess(userKitchens);
        }

        const parsed = kitchenQuerySchema.safeParse(params);

        if (!parsed.success) {
            const errors = parsed.error.flatten().fieldErrors as Record<string, string[]>;
            return apiBadRequest("Invalid query parameters", errors);
        }

        const result = await listKitchens({
            ...parsed.data,
            page: Math.max(1, parseInt(params.page ?? "1")),
            limit: Math.min(50, Math.max(1, parseInt(params.limit ?? "20"))),
            sort: params.sort === 'distance' ? 'boost' : parsed.data.sort // handle distance sort manually below
        });

        let finalKitchens: any[] = result.kitchens.map((k: any) => ({ ...k, distanceKm: null }));

        if (params.lat && params.lng) {
            const userLat = parseFloat(params.lat);
            const userLng = parseFloat(params.lng);
            if (!isNaN(userLat) && !isNaN(userLng)) {
                finalKitchens = finalKitchens.map(k => {
                    let distanceKm = null;
                    if (k.latitude && k.longitude) {
                        const kLat = parseFloat(k.latitude);
                        const kLng = parseFloat(k.longitude);
                        if (!isNaN(kLat) && !isNaN(kLng)) {
                            distanceKm = Math.round(haversineKm(userLat, userLng, kLat, kLng) * 10) / 10;
                        }
                    }
                    return { ...k, distanceKm };
                });

                if (params.sort === 'distance') {
                    finalKitchens.sort((a, b) => {
                        if (a.distanceKm === null) return 1;
                        if (b.distanceKm === null) return -1;
                        return a.distanceKm - b.distanceKm;
                    });
                }
            }
        }

        // Compute ETag
        const hash = createHash("sha256").update(JSON.stringify(result)).digest("hex").substring(0, 16);
        const etag = `"${hash}"`;
        const ifNoneMatch = request.headers.get("if-none-match");

        if (ifNoneMatch === etag) {
            return new Response(null, { status: 304 });
        }

        const response = apiPaginated(finalKitchens, {
            page: result.page,
            limit: result.limit,
            total: result.total,
        });

        response.headers.set("ETag", etag);
        return response;
    } catch (error) {
        console.error("[List Kitchens Error]", {
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
        });
        return apiInternalError("Failed to fetch kitchens");
    }
}

/**
 * POST /api/kitchens
 * Auth required: Create a new kitchen (upgrades user to COOK role).
 *
 * Sequential flow (no transactions on Neon HTTP):
 *   Step 1: Insert kitchen
 *   Step 2: Update user role to COOK in DB + Firebase custom claims
 *   Step 3: If Step 2 fails → delete the kitchen (compensation)
 */
export async function POST(request: NextRequest) {
    try {
        // ── Auth check ──
        const user = await getAuthUser(request);
        if (!user) return apiUnauthorized();

        // ── Validate input ──
        const body = await request.json();
        const parsed = createKitchenSchema.safeParse(body);

        if (!parsed.success) {
            const errors = parsed.error.flatten().fieldErrors as Record<string, string[]>;
            return apiBadRequest("Invalid kitchen data", errors);
        }

        // ── Step 1: Insert kitchen (ownerId from auth, never from body) ──
        const kitchen = await createKitchen(user.id, parsed.data);

        // ── Non-blocking Trial Creation ──
        let trialCreated = true;
        try {
            const { startFreeTrial } = await import("@/services/premium.service");
            await startFreeTrial(kitchen.id, user.id);
        } catch (err) {
            trialCreated = false;
            console.error("[CRITICAL] Trial creation failed", { kitchenId: kitchen.id, err });
            // Kitchen remains ACTIVE — do not fail registration
        }

        // ── Step 2: Update user role to COOK ──
        try {
            await updateUserRole(user.id, "COOK");

            // Also set Firebase custom claims so the client token reflects the new role
            await setUserRoleClaim(user.firebaseUid, "COOK");
        } catch (roleError) {
            // ── Step 3: Compensation — delete the kitchen we just created ──
            console.error("[Create Kitchen] Role update failed, compensating:", roleError);
            try {
                await db.delete(kitchens).where(eq(kitchens.id, kitchen.id));
                console.log("[Create Kitchen] Compensation: deleted kitchen", kitchen.id);
            } catch (deleteError) {
                console.error("[Create Kitchen] Compensation delete ALSO failed:", deleteError);
            }
            return apiInternalError("Failed to complete kitchen registration. Please try again.");
        }

        // ── Success ──
        return apiCreated({ kitchen, role: "COOK" as const, trialCreated });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error("[Create Kitchen Error]", error);

        if (message.includes("duplicate")) {
            return apiBadRequest("A kitchen with that name already exists");
        }

        return apiInternalError("Failed to create kitchen");
    }
}
