import { NextResponse } from "next/server";
import { getAdminSession, clearAdminSession, hashJti } from "@/lib/admin-auth/session";
import { db } from "@/lib/db";
import { adminSessions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function POST() {
    const session = await getAdminSession();

    if (session) {
        // Revoke session in DB so the JWT is dead even before it expires
        await db
            .update(adminSessions)
            .set({ revokedAt: new Date() })
            .where(eq(adminSessions.jtiHash, hashJti(session.jti)));
    }

    await clearAdminSession();

    return NextResponse.json({
        success: true,
        redirectTo: process.env.NEXT_PUBLIC_BASE_URL || "https://smarttiffinfood.vercel.app",
    });
}
