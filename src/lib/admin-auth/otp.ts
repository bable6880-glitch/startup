import crypto from "crypto";
import bcrypt from "bcryptjs";

// No O, 0, I, 1 — removes visually confusable characters
const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateOTP(): string {
    const bytes = crypto.randomBytes(6);
    return Array.from(bytes)
        .map((b) => CHARSET[b % CHARSET.length])
        .join("");
}

export async function hashOTP(otp: string): Promise<string> {
    return bcrypt.hash(otp.toUpperCase(), 10);
}

export async function verifyOTP(otp: string, hash: string): Promise<boolean> {
    return bcrypt.compare(otp.toUpperCase(), hash);
}

export function maskEmail(email: string): string {
    const [local, domain] = email.split("@");
    const masked = local[0] + "***";
    return `${masked}@${domain}`;
}
