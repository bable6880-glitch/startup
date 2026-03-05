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

// In-memory rate limiter (per Lambda instance on Amplify)
const requestCounts = new Map<string, { count: number; resetAt: number }>();

// ─── CORS Origins ─────────────────────────────────────────────────────────
// Build the allowed origins list dynamically so it works across:
//   • AWS Amplify (NEXT_PUBLIC_BASE_URL set in Amplify Console env vars)
//   • Local development
//   • Any future deployment without code changes
function getAllowedOrigins(): string[] {
    const origins: string[] = [
        "http://localhost:3000",
        "http://localhost:3001",
    ];

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    if (baseUrl) {
        origins.push(baseUrl.replace(/\/$/, "")); // strip trailing slash
    }

    return origins;
}

const MAX_BODY_SIZE = 1_048_576; // 1MB

// ─── CORS Header Helper ──────────────────────────────────────────────────────

function addCorsHeaders(response: NextResponse, origin: string | null) {
    const allowedOrigins = getAllowedOrigins();
    const effectiveOrigin =
        origin && allowedOrigins.includes(origin)
            ? origin
            : allowedOrigins[0]; // fallback to localhost in dev

    response.headers.set("Access-Control-Allow-Origin", effectiveOrigin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set(
        "Access-Control-Allow-Methods",
        "GET, POST, PUT, PATCH, DELETE, OPTIONS"
    );
    response.headers.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, X-Requested-With"
    );
    response.headers.set("Access-Control-Max-Age", "86400");
    return response;
}

// ─── Middleware ──────────────────────────────────────────────────────────────

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Only apply to API routes
    if (!pathname.startsWith("/api")) {
        return NextResponse.next();
    }

    const origin = request.headers.get("origin");

    // ── Handle CORS Preflight (OPTIONS) ──────────────────────────────────────
    // Amplify's CDN may send preflight requests; we must respond with 204.
    if (request.method === "OPTIONS") {
        const preflightResponse = new NextResponse(null, { status: 204 });
        addCorsHeaders(preflightResponse, origin);
        return preflightResponse;
    }

    // ── 1. Request Body Size Check ────────────────────────────────────────────
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

    // ── 2. Rate Limiting (In-Memory per Lambda instance) ─────────────────────
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
            requestCounts.set(rateLimitKey, {
                count: 1,
                resetAt: now + RATE_LIMIT_WINDOW_MS,
            });
        } else if (existing.count >= limit) {
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

    // ── 3. Build response with CORS + Security headers ───────────────────────
    const response = NextResponse.next();
    addCorsHeaders(response, origin);

    // Security headers
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-Frame-Options", "SAMEORIGIN");
    response.headers.set("X-XSS-Protection", "1; mode=block");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

    // Rate limit info headers
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
