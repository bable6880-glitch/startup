import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { adminUsers, adminOtpCodes, adminSessions } from "@/lib/db/schema";
import { and, eq, isNull, gt, desc } from "drizzle-orm";
import { verifyOTP } from "@/lib/admin-auth/otp";
import { createAdminSession, hashJti } from "@/lib/admin-auth/session";
import { redis } from "@/lib/redis";

const schema = z.object({
    pendingToken: z.string().uuid(),
    code:         z.string().length(6),
});

export async function POST(req: NextRequest) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

    const body = await req.json().catch(() => null);
    if (!body) {
        return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { pendingToken, code } = parsed.data;

    // Resolve pending token → adminUserId
    if (!redis) {
        return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }

    const adminId = await redis.get<string>(`admin_pending:${pendingToken}`);
    if (!adminId) {
        return NextResponse.json(
            { error: "Session expired. Please login again." },
            { status: 401 }
        );
    }

    // Get latest unused, non-expired OTP for this admin
    const otp = await db.query.adminOtpCodes.findFirst({
        where: and(
            eq(adminOtpCodes.adminUserId, adminId),
            isNull(adminOtpCodes.usedAt),
            gt(adminOtpCodes.expiresAt, new Date())
        ),
        orderBy: [desc(adminOtpCodes.createdAt)],
    });

    if (!otp) {
        return NextResponse.json(
            { error: "Code expired. Please login again." },
            { status: 401 }
        );
    }

    // Increment attempts first (before verify — prevents race conditions)
    const newAttempts = otp.attempts + 1;
    await db
        .update(adminOtpCodes)
        .set({ attempts: newAttempts })
        .where(eq(adminOtpCodes.id, otp.id));

    if (newAttempts > 3) {
        // Invalidate OTP and pending token
        await db
            .update(adminOtpCodes)
            .set({ usedAt: new Date() })
            .where(eq(adminOtpCodes.id, otp.id));
        await redis.del(`admin_pending:${pendingToken}`);

        return NextResponse.json(
            { error: "Too many attempts. Please login again.", maxAttemptsReached: true },
            { status: 401 }
        );
    }

    // Verify the code
    const isValid = await verifyOTP(code, otp.codeHash);

    if (!isValid) {
        const attemptsLeft = 3 - newAttempts;
        return NextResponse.json(
            { error: `Invalid code. ${attemptsLeft} attempt(s) remaining.`, attemptsLeft },
            { status: 401 }
        );
    }

    // ✅ Code is correct — mark OTP as used
    await db
        .update(adminOtpCodes)
        .set({ usedAt: new Date() })
        .where(eq(adminOtpCodes.id, otp.id));

    // Delete pending token from Redis
    await redis.del(`admin_pending:${pendingToken}`);

    // Get admin details
    const admin = await db.query.adminUsers.findFirst({
        where: eq(adminUsers.id, adminId),
    });

    if (!admin || !admin.isActive) {
        return NextResponse.json({ error: "Account not found." }, { status: 403 });
    }

    // Create JWT session + set cookie
    const { jti } = await createAdminSession(admin.id, admin.username, admin.role);

    // Store session record in DB for revocation support
    await db.insert(adminSessions).values({
        adminUserId:   admin.id,
        jtiHash:       hashJti(jti),
        ipAddress:     ip,
        userAgent:     req.headers.get("user-agent") ?? "",
        expiresAt:     new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours
    });

    // Update last login timestamp
    await db
        .update(adminUsers)
        .set({ lastLoginAt: new Date() })
        .where(eq(adminUsers.id, admin.id));

    return NextResponse.json({ success: true });
}
