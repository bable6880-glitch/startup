import { NextRequest, NextResponse } from "next/server";

// ─── Configuration ──────────────────────────────────────────────────────────

const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const publicLimits: Record<string, number> = {
    "/api/auth": 10,
    "/api/kitchens": 60,
    "/api/search": 60,
    "/api/reviews": 30,
    "/api/orders": 20,
    "/api/premium": 20,
    "/api/admin": 30,
};
const DEFAULT_LIMIT = 60;

// In-memory rate limiter (for Edge Runtime — use Redis in production via API)
const requestCounts = new Map<string, { count: number; resetAt: number }>();

const ALLOWED_ORIGINS = [
    process.env.NEXT_PUBLIC_BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"),
    // Add production URL here
];

const MAX_BODY_SIZE = 1_048_576; // 1MB


// ─── Middleware ──────────────────────────────────────────────────────────────

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Only apply to API routes
    if (!pathname.startsWith("/api")) {
        return NextResponse.next();
    }

    // ── 1. CORS ──
    const origin = request.headers.get("origin");
    const response = NextResponse.next();

    if (origin && ALLOWED_ORIGINS.includes(origin)) {
        response.headers.set("Access-Control-Allow-Origin", origin);
    }
    response.headers.set(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, DELETE, OPTIONS"
    );
    response.headers.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization"
    );
    response.headers.set("Access-Control-Max-Age", "86400");

    // Handle preflight
    if (request.method === "OPTIONS") {
        return new NextResponse(null, {
            status: 204,
            headers: response.headers,
        });
    }

    // ── 2. Request Body Size Check ──
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > MAX_BODY_SIZE) {
        return NextResponse.json(
            {
                success: false,
                error: {
                    code: "PAYLOAD_TOO_LARGE",
                    message: "Request body too large (max 1MB)",
                },
            },
            { status: 413 }
        );
    }

    // ── 3. Rate Limiting (In-Memory for Edge) ──
    const clientIp =
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip") ||
        "unknown";

    const rateLimitKey = `${clientIp}:${pathname.split("/").slice(0, 3).join("/")}`;
    const now = Date.now();

    const existing = requestCounts.get(rateLimitKey);
    const routePrefix = "/" + pathname.split("/").slice(1, 3).join("/");
    const limit = publicLimits[routePrefix] || DEFAULT_LIMIT;

    if (existing) {
        if (now > existing.resetAt) {
            // Window expired — reset
            requestCounts.set(rateLimitKey, {
                count: 1,
                resetAt: now + RATE_LIMIT_WINDOW_MS,
            });
        } else if (existing.count >= limit) {
            // Rate limited
            return NextResponse.json(
                {
                    success: false,
                    error: {
                        code: "RATE_LIMITED",
                        message: "Too many requests. Please try again later.",
                    },
                },
                {
                    status: 429,
                    headers: {
                        "Retry-After": Math.ceil(
                            (existing.resetAt - now) / 1000
                        ).toString(),
                        "X-RateLimit-Limit": limit.toString(),
                        "X-RateLimit-Remaining": "0",
                        "X-RateLimit-Reset": existing.resetAt.toString(),
                    },
                }
            );
        } else {
            existing.count++;
        }
    } else {
        requestCounts.set(rateLimitKey, {
            count: 1,
            resetAt: now + RATE_LIMIT_WINDOW_MS,
        });
    }

    // ── 4. Security Headers ──
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-XSS-Protection", "1; mode=block");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set(
        "Permissions-Policy",
        "camera=(), microphone=(), geolocation=()"
    );

    // ── 5. Add Rate Limit Headers ──
    const currentCount = requestCounts.get(rateLimitKey);
    if (currentCount) {
        response.headers.set("X-RateLimit-Limit", limit.toString());
        response.headers.set(
            "X-RateLimit-Remaining",
            Math.max(0, limit - currentCount.count).toString()
        );
        response.headers.set(
            "X-RateLimit-Reset",
            currentCount.resetAt.toString()
        );
    }

    return response;
}

// ─── Matcher ────────────────────────────────────────────────────────────────

export const config = {
    matcher: ["/api/:path*"],
};
