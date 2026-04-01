import { NextRequest } from "next/server";
import { syncAuthSchema } from "@/lib/validations/auth";
import { syncUser } from "@/services/auth.service";
import { FirebaseAuthError } from "@/lib/auth/firebase-admin";
import {
    apiSuccess,
    apiBadRequest,
    apiInternalError,
    apiUnauthorized,
    apiForbidden,
} from "@/lib/utils/api-response";

/**
 * OPTIONS /api/auth/sync
 * Handle CORS preflight (required for Amplify + cross-origin mobile/web clients)
 */
export async function OPTIONS() {
    return new Response(null, {
        status: 204,
        headers: {
            "Access-Control-Allow-Origin": process.env.NEXT_PUBLIC_BASE_URL || "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Max-Age": "86400",
        },
    });
}

/**
 * POST /api/auth/sync
 * Sync Firebase user to Postgres on login.
 * Body: { idToken: string }
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate input
        const parsed = syncAuthSchema.safeParse(body);
        if (!parsed.success) {
            const errors = parsed.error.flatten().fieldErrors as Record<string, string[]>;
            return apiBadRequest("Invalid input", errors);
        }

        const user = await syncUser(parsed.data.idToken, parsed.data.fcmToken);
        return apiSuccess(user);
    } catch (error: unknown) {
        // ── Firebase/Auth errors — return proper 401/403 ──
        if (error instanceof FirebaseAuthError) {
            console.error("[Auth Sync] Firebase auth error:", {
                code: error.code,
                message: error.message,
                httpStatus: error.httpStatus,
            });

            if (error.httpStatus === 403) {
                return apiForbidden(error.message);
            }

            // 401 for expired, revoked, invalid tokens
            return apiUnauthorized(error.message);
        }

        // ── Application-level errors ──
        const message = error instanceof Error ? error.message : "Authentication failed";

        if (message === "Account is suspended") {
            return apiUnauthorized("Your account has been suspended");
        }

        // ── Unexpected errors ──
        console.error("[Auth Sync] Unexpected error:", {
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
        });
        return apiInternalError("Failed to sync user");
    }
}
