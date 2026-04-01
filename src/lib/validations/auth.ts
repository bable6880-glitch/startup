import { z } from "zod";

// ─── Auth Validation ────────────────────────────────────────────────────────

export const syncAuthSchema = z.object({
    idToken: z.string().min(1, "Firebase ID token is required"),
    fcmToken: z.string().optional(),
});

// ─── Email regex: standard RFC-compliant pattern ────────────────────────────

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// ─── Password: min 8 chars, uppercase, lowercase, number, special char ──────

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

// ─── Cook Registration Schema ───────────────────────────────────────────────

export const cookRegisterSchema = z.object({
    username: z
        .string()
        .min(3, "Username must be at least 3 characters")
        .max(30, "Username must be at most 30 characters")
        .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
        .trim(),
    email: z
        .string()
        .min(1, "Email is required")
        .regex(emailRegex, "Please enter a valid email address")
        .trim()
        .toLowerCase(),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(
            passwordRegex,
            "Password must include uppercase, lowercase, number, and special character"
        ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

// ─── Cook Login Schema ──────────────────────────────────────────────────────

export const cookLoginSchema = z.object({
    email: z
        .string()
        .min(1, "Email is required")
        .regex(emailRegex, "Please enter a valid email address")
        .trim()
        .toLowerCase(),
    password: z.string().min(1, "Password is required"),
});

export type SyncAuthInput = z.infer<typeof syncAuthSchema>;
export type CookRegisterInput = z.infer<typeof cookRegisterSchema>;
export type CookLoginInput = z.infer<typeof cookLoginSchema>;
