import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";

// ─── Custom Auth Error ──────────────────────────────────────────────────────

export class FirebaseAuthError extends Error {
    code: string;
    httpStatus: number;

    constructor(message: string, code: string, httpStatus: number) {
        super(message);
        this.name = "FirebaseAuthError";
        this.code = code;
        this.httpStatus = httpStatus;
    }
}

// ─── Singleton Admin Init ───────────────────────────────────────────────────

let _app: App | null = null;
let _auth: Auth | null = null;

/**
 * Lazily initialize Firebase Admin SDK (singleton).
 * Prevents build-time failures when env vars are not available.
 */
function getFirebaseAdmin(): Auth {
    if (_auth) return _auth;

    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (!serviceAccountKey) {
        throw new FirebaseAuthError(
            "FIREBASE_SERVICE_ACCOUNT_KEY is not set",
            "auth/config-missing",
            500
        );
    }

    // ✅ Fix literal \n → real newlines in case the key was pasted incorrectly in Amplify
    let serviceAccount;
    try {
        const cleaned = serviceAccountKey.replace(/\\n/g, "\n");
        serviceAccount = JSON.parse(cleaned);
    } catch (err) {
        throw new FirebaseAuthError(
            `Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY: ${err}`,
            "auth/config-invalid",
            500
        );
    }

    _app =
        getApps().length === 0
            ? initializeApp({ credential: cert(serviceAccount) })
            : getApps()[0];

    _auth = getAuth(_app);
    return _auth;
}

/**
 * Verify a Firebase ID token and return the decoded claims.
 * Wraps all Firebase errors into typed FirebaseAuthError with proper HTTP status codes.
 */
export async function verifyFirebaseToken(idToken: string) {
    try {
        const auth = getFirebaseAdmin();
        // checkRevoked: true ensures revoked tokens are rejected
        const decoded = await auth.verifyIdToken(idToken, true);
        return decoded;
    } catch (error: unknown) {
        // Extract Firebase error code if present
        const firebaseCode =
            (error as { code?: string })?.code ??
            (error as { errorInfo?: { code?: string } })?.errorInfo?.code ??
            "unknown";

        const originalMessage =
            error instanceof Error ? error.message : "Token verification failed";

        console.error("[Firebase Admin] verifyIdToken failed:", {
            code: firebaseCode,
            message: originalMessage,
        });

        // Map Firebase error codes → user-friendly message + HTTP status
        switch (firebaseCode) {
            case "auth/id-token-expired":
                throw new FirebaseAuthError(
                    "Token has expired. Please sign in again.",
                    "auth/id-token-expired",
                    401
                );

            case "auth/id-token-revoked":
                throw new FirebaseAuthError(
                    "Token has been revoked. Please sign in again.",
                    "auth/id-token-revoked",
                    401
                );

            case "auth/argument-error":
            case "auth/invalid-id-token":
                throw new FirebaseAuthError(
                    "Invalid authentication token.",
                    "auth/invalid-id-token",
                    401
                );

            case "auth/user-disabled":
                throw new FirebaseAuthError(
                    "This account has been disabled.",
                    "auth/user-disabled",
                    403
                );

            default:
                // Catch-all for audience mismatch, certificate errors, etc.
                if (
                    originalMessage.includes("audience") ||
                    originalMessage.includes("aud") ||
                    originalMessage.includes("project")
                ) {
                    throw new FirebaseAuthError(
                        "Token was issued for a different project. Please sign out and sign in again.",
                        "auth/invalid-audience",
                        401
                    );
                }

                throw new FirebaseAuthError(
                    "Authentication failed. Please try again.",
                    firebaseCode,
                    401
                );
        }
    }
}

/**
 * Set custom claims on a Firebase user (e.g., role).
 * This allows middleware and client to read the role from the token.
 */
export async function setUserRoleClaim(
    firebaseUid: string,
    role: "CUSTOMER" | "COOK" | "ADMIN"
) {
    try {
        const auth = getFirebaseAdmin();
        await auth.setCustomUserClaims(firebaseUid, { role });
    } catch (error) {
        console.error("[Firebase Admin] setCustomUserClaims failed:", error);
        // Non-fatal: the DB is the source of truth, claims are supplementary
    }
}