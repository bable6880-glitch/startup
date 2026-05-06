import { NextResponse } from "next/server";
import { getAdminSession, clearAdminSession, hashJti } from "@/lib/admin-auth/session";
import { db } from "@/lib/db";
import { adminSessions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST() {
    const session = await getAdminSession();

    if (session) {
        // 1. Revoke session in DB
        await db
            .update(adminSessions)
            .set({ revokedAt: new Date() })
            .where(eq(adminSessions.jtiHash, hashJti(session.jti)));
        
        console.log(`[Logout] Revoked session for admin: ${session.username} (jti: ${session.jti})`);
    }

    // 2. Clear cookie robustly
    await clearAdminSession();

    // 3. Optional: Invalidate any admin-specific cache if needed
    // if (redis && session) { await redis.del(`admin_cache:${session.sub}`); }

    return NextResponse.json({
        success: true,
        message: "Logged out successfully",
    });
}
