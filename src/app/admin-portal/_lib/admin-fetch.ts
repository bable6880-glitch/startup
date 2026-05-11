/**
 * Admin Portal API Helper
 *
 * Wraps fetch() to automatically attach the X-CSRF-Token header
 * for state-changing requests (POST, PUT, PATCH, DELETE).
 *
 * Usage:
 *   import { adminFetch, setAdminCsrfToken } from "@/app/admin-portal/_lib/admin-fetch";
 *   const res = await adminFetch("/api/admin-portal/kitchens/123", { method: "PATCH", body: ... });
 */

const CSRF_KEY = "st_admin_csrf";

/** Call once after successful OTP verification to store the CSRF token */
export function setAdminCsrfToken(token: string): void {
    if (typeof window !== "undefined") {
        sessionStorage.setItem(CSRF_KEY, token);
    }
}

/** Clear the CSRF token on logout */
export function clearAdminCsrfToken(): void {
    if (typeof window !== "undefined") {
        sessionStorage.removeItem(CSRF_KEY);
    }
}

/** Get the current CSRF token */
export function getAdminCsrfToken(): string | null {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem(CSRF_KEY);
}

/**
 * Fetch wrapper that automatically attaches X-CSRF-Token
 * for non-GET requests.
 */
export async function adminFetch(
    url: string,
    init?: RequestInit
): Promise<Response> {
    const method = (init?.method ?? "GET").toUpperCase();
    const headers = new Headers(init?.headers);

    // Attach CSRF token for state-changing methods
    if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
        const csrf = getAdminCsrfToken();
        if (csrf) {
            headers.set("X-CSRF-Token", csrf);
        }
    }

    return fetch(url, { ...init, headers });
}
