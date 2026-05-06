import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import crypto from "crypto";

let _secret: Uint8Array | null = null;
function getSecret(): Uint8Array {
    if (!_secret) {
        const secretVal = process.env.ADMIN_JWT_SECRET;
        if (!secretVal || secretVal.trim() === "") {
            console.error("CRITICAL ERROR: ADMIN_JWT_SECRET is missing from environment variables.");
            throw new Error("ADMIN_JWT_SECRET environment variable is not configured.");
        }
        _secret = new TextEncoder().encode(secretVal);
    }
    return _secret;
}
const COOKIE  = "st_admin_session";
const TTL_SEC = 8 * 60 * 60; // 8 hours

export interface AdminSession {
    sub:      string; // adminUserId
    jti:      string; // unique token ID
    username: string;
    role:     string;
    iat:      number;
    exp:      number;
}

export async function createAdminSession(
    adminUserId: string,
    username: string,
    role: string
): Promise<{ token: string; jti: string }> {
    const jti = crypto.randomUUID();

    const token = await new SignJWT({ sub: adminUserId, jti, username, role })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime(`${TTL_SEC}s`)
        .setIssuer("smart-tiffin-admin")
        .setAudience("admin-portal")
        .sign(getSecret());

    const cookieStore = await cookies();
    cookieStore.set(COOKIE, token, {
        httpOnly:  true,
        secure:    process.env.NODE_ENV === "production",
        sameSite:  "strict",
        maxAge:    TTL_SEC,
        path:      "/", // must cover both /admin-portal pages and /api/admin-portal routes
    });

    return { token, jti };
}

export async function verifyAdminSession(token: string): Promise<AdminSession | null> {
    try {
        const { payload } = await jwtVerify(token, getSecret(), {
            issuer:   "smart-tiffin-admin",
            audience: "admin-portal",
        });
        return payload as unknown as AdminSession;
    } catch {
        return null;
    }
}

export async function getAdminSession(): Promise<AdminSession | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE)?.value;
    if (!token) return null;
    return verifyAdminSession(token);
}

export async function clearAdminSession(): Promise<void> {
    const cookieStore = await cookies();
    
    // Explicitly overwrite with expired date to ensure deletion across all browsers
    cookieStore.set(COOKIE, "", {
        httpOnly: true,
        secure:   process.env.NODE_ENV === "production",
        sameSite: "strict",
        path:     "/",
        expires:  new Date(0),
        maxAge:   0,
    });

    // Also try standard delete for both possible paths
    cookieStore.delete({ name: COOKIE, path: "/" });
    cookieStore.delete({ name: COOKIE, path: "/admin-portal" });
}

export function hashJti(jti: string): string {
    return crypto.createHash("sha256").update(jti).digest("hex");
}
