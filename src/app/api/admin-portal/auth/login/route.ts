import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { adminUsers, adminOtpCodes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateOTP, hashOTP, maskEmail } from "@/lib/admin-auth/otp";
import { sendOTPEmail } from "@/lib/admin-auth/email";
import { redis } from "@/lib/redis";
import crypto from "crypto";

const schema = z.object({
    email:    z.string().email(),
    password: z.string().min(1),
});

export async function POST(req: NextRequest) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

    const body = await req.json().catch(() => null);
    if (!body) {
        return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: "Invalid email or password format" }, { status: 400 });
    }

    const { email, password } = parsed.data;

    // Look up admin — use GENERIC error for both "not found" and "wrong password"
    // Never reveal which one failed — prevents account enumeration
    const admin = await db.query.adminUsers.findFirst({
        where: eq(adminUsers.email, email.toLowerCase()),
    });

    const GENERIC_ERROR = "Invalid email or password";

    if (!admin) {
        // Still do a dummy bcrypt compare to prevent timing attacks
        await bcrypt.compare(password, "$2b$12$dummyhashfordummycomparison00000000000000000");
        return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
    }

    if (!admin.isActive) {
        return NextResponse.json(
            { error: "Account suspended. Contact system administrator." },
            { status: 403 }
        );
    }

    // Check lockout
    if (admin.lockedUntil && admin.lockedUntil > new Date()) {
        const minutesLeft = Math.ceil(
            (admin.lockedUntil.getTime() - Date.now()) / 60000
        );
        return NextResponse.json(
            { error: `Account locked. Try again in ${minutesLeft} minute(s).` },
            { status: 423 }
        );
    }

    // Verify password
    const passwordOk = await bcrypt.compare(password, admin.passwordHash);

    if (!passwordOk) {
        const newAttempts = admin.loginAttempts + 1;
        const shouldLock  = newAttempts >= 5;

        await db
            .update(adminUsers)
            .set({
                loginAttempts: newAttempts,
                lockedUntil:   shouldLock
                    ? new Date(Date.now() + 30 * 60 * 1000) // 30 min lockout
                    : null,
            })
            .where(eq(adminUsers.id, admin.id));

        return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
    }

    // Password correct — reset login attempts
    await db
        .update(adminUsers)
        .set({ loginAttempts: 0, lockedUntil: null })
        .where(eq(adminUsers.id, admin.id));

    // Generate OTP
    const otp      = generateOTP();
    const codeHash = await hashOTP(otp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await db.insert(adminOtpCodes).values({
        adminUserId: admin.id,
        codeHash,
        expiresAt,
        ipAddress: ip,
    });

    // Store a short-lived pending token in Redis (maps to adminUserId)
    // Client holds this token to submit with OTP — never exposes adminUserId
    const pendingToken = crypto.randomUUID();
    if (redis) {
        await redis.set(`admin_pending:${pendingToken}`, admin.id, { ex: 600 }); // 10 min TTL
    }

    // Send OTP email
    await sendOTPEmail({
        to:               admin.email,
        displayName:      admin.displayName,
        otp,
        ipAddress:        ip,
        expiresInMinutes: 10,
    });

    return NextResponse.json({
        success:      true,
        pendingToken,
        maskedEmail:  maskEmail(admin.email),
        expiresIn:    600,
    });
}
