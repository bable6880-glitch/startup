import { NextRequest } from "next/server";
import { verifyFirebaseToken, setUserRoleClaim } from "@/lib/auth/firebase-admin";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export type AuthUser = {
    id: string;
    firebaseUid: string;
    email: string | null;
    name: string | null;
    role: "CUSTOMER" | "COOK" | "ADMIN";
    isActive: boolean;
};

/**
 * Extract and verify auth user from request.
 * Returns null if no valid auth is present (don't throw — let route decide).
 *
 * Usage:
 *   const user = await getAuthUser(request);
 *   if (!user) return apiUnauthorized();
 */
export async function getAuthUser(request: NextRequest): Promise<AuthUser | null> {
    try {
        // Extract token from Authorization header or query param (for SSE)
        let idToken: string | null = null;
        const authHeader = request.headers.get("authorization");

        if (authHeader?.startsWith("Bearer ")) {
            idToken = authHeader.slice(7);
        } else {
            const { searchParams } = new URL(request.url);
            idToken = searchParams.get("token");
        }

        if (!idToken) return null;

        // Verify with Firebase Admin
        const decoded = await verifyFirebaseToken(idToken);

        // Look up user in database
        const user = await db.query.users.findFirst({
            where: eq(users.firebaseUid, decoded.uid),
        });

        if (!user || !user.isActive) return null;

        // Role reconciliation (DB as source of truth)
        if (decoded.role !== user.role) {
            await setUserRoleClaim(decoded.uid, user.role);
        }

        return {
            id: user.id,
            firebaseUid: user.firebaseUid,
            email: user.email,
            name: user.name,
            role: user.role,
            isActive: user.isActive,
        };
    } catch {
        // Any error = not authenticated
        return null;
    }
}

/**
 * Require specific roles. Works with getAuthUser.
 */
export function requireRole(user: AuthUser, ...roles: AuthUser["role"][]): boolean {
    return roles.includes(user.role);
}
