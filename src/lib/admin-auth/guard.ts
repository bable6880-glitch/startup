/**
 * Admin Portal Route Guard
 *
 * Use this at the top of every /api/admin-portal/* route handler:
 *
 *   const result = await guardAdminPortal(req);
 *   if (!result.ok) return result.response;
 *   const { admin } = result;
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, hashJti } from "./session";
import { db } from "@/lib/db";
import { adminSessions, adminUsers } from "@/lib/db/schema";
import { and, eq, isNull, gt } from "drizzle-orm";

export type AuthedAdmin = {
    id:          string;
    username:    string;
    role:        string;
    displayName: string;
};

type GuardSuccess = { ok: true;  admin: AuthedAdmin };
type GuardFailure = { ok: false; response: NextResponse };
export type GuardResult = GuardSuccess | GuardFailure;

export async function guardAdminPortal(req: NextRequest): Promise<GuardResult> {
    const session = await getAdminSession();

    if (!session) {
        return {
            ok: false,
            response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
        };
    }

    // ── CSRF Protection (state-changing methods only) ────────────────────
    // Double-submit variant: the JWT cookie contains a unique jti.
    // The client sends the same jti as X-CSRF-Token header.
    // SameSite:strict prevents cross-origin cookie attachment,
    // and the header proves same-origin JS initiated the request.
    const method = req.method.toUpperCase();
    if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
        const csrfToken = req.headers.get("x-csrf-token");
        if (!csrfToken || csrfToken !== session.jti) {
            return {
                ok: false,
                response: NextResponse.json(
                    { error: "CSRF token missing or invalid" },
                    { status: 403 }
                ),
            };
        }
    }

    // Verify session is not revoked in DB
    const jtiH = hashJti(session.jti);
    const dbSession = await db.query.adminSessions.findFirst({
        where: and(
            eq(adminSessions.jtiHash, jtiH),
            isNull(adminSessions.revokedAt),
            gt(adminSessions.expiresAt, new Date())
        ),
    });

    if (!dbSession) {
        return {
            ok: false,
            response: NextResponse.json({ error: "Session expired" }, { status: 401 }),
        };
    }

    // Verify admin is still active
    const admin = await db.query.adminUsers.findFirst({
        where: and(eq(adminUsers.id, session.sub), eq(adminUsers.isActive, true)),
    });

    if (!admin) {
        return {
            ok: false,
            response: NextResponse.json({ error: "Account suspended" }, { status: 403 }),
        };
    }

    // Refresh last activity timestamp (fire-and-forget)
    db.update(adminSessions)
        .set({ lastActivityAt: new Date() })
        .where(eq(adminSessions.jtiHash, jtiH))
        .catch(() => {});

    return {
        ok: true,
        admin: {
            id:          admin.id,
            username:    admin.username,
            role:        admin.role,
            displayName: admin.displayName,
        },
    };
}
