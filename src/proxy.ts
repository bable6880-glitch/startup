import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ─── Configuration ──────────────────────────────────────────────────────────

import { rateLimiters, getLimiterKey, getClientIp } from "@/lib/rate-limit";
import { logger } from "@/lib/utils/logger";
import { randomUUID } from "crypto";

// ─── CORS Origins ─────────────────────────────────────────────────────────
// Build the allowed origins list dynamically so it works across:
//   • AWS Amplify (NEXT_PUBLIC_BASE_URL set in Amplify Console env vars)
//   • Local development
//   • Any future deployment without code changes
function getAllowedOrigins(): string[] {
    const origins: string[] = [];

    // Only allow localhost in non-production environments (Rule #6)
    if (process.env.NODE_ENV !== "production") {
        origins.push("http://localhost:3000");
        origins.push("http://localhost:3001");
    }

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

// ─── Proxy ──────────────────────────────────────────────────────────────────
// Next.js 16+ requires `proxy.ts` to export a function named `proxy`.

export async function proxy(request: NextRequest) {
    const requestId = randomUUID();
    const { pathname } = request.nextUrl;
    const ip = getClientIp(request);

    const start = Date.now();
    let finalResponse: NextResponse;
    // We do not have user context natively in proxy unless we decode JWT, default to null
    const userId = null;
    const route = `${request.method} ${pathname}`;

    try {
        // Only apply to API routes
        if (!pathname.startsWith("/api/")) {
            return NextResponse.next();
        }

    const origin = request.headers.get("origin");

    // ── Handle CORS Preflight (OPTIONS) ──────────────────────────────────────
    // Amplify's CDN may send preflight requests; we must respond with 204.
    if (request.method === "OPTIONS") {
        finalResponse = new NextResponse(null, { status: 204 });
        addCorsHeaders(finalResponse, origin);
        return finalResponse;
    }

    // ── 1. Request Body Size Check ────────────────────────────────────────────
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > MAX_BODY_SIZE) {
        finalResponse = NextResponse.json(
            {
                success: false,
                error: {
                    code: "PAYLOAD_TOO_LARGE",
                    message: "Request body too large (max 1MB)",
                },
            },
            { status: 413 }
        );
        return finalResponse;
    }

    // ── 2. Rate Limiting (Distributed) ─────────────────────────────────────────
    let rateLimitInfo = null;

    if (pathname !== "/api/health") {
        const limiterKey = getLimiterKey(pathname);
        const limiter = rateLimiters[limiterKey];
        
        const isCriticalRoute = pathname.startsWith("/api/auth") || pathname.startsWith("/api/orders");

        if (isCriticalRoute && !limiter) {
            finalResponse = NextResponse.json(
                { success: false, error: { code: "SERVICE_UNAVAILABLE", message: "Service temporarily unavailable" } },
                { status: 503 }
            );
            return finalResponse;
        }

        if (limiter) {
            try {
                const identifier = `${ip}:${limiterKey}`;
                const { success, limit, remaining, reset } = await limiter.limit(identifier);

                rateLimitInfo = { limit, remaining, reset };

                if (!success) {
                    finalResponse = NextResponse.json(
                        {
                            success: false,
                            error: {
                                code: "RATE_LIMITED",
                                message: "Too many requests. Please slow down.",
                            },
                        },
                        {
                            status: 429,
                            headers: {
                                "X-RateLimit-Limit": limit.toString(),
                                "X-RateLimit-Remaining": "0",
                                "X-RateLimit-Reset": reset.toString(),
                                "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
                            },
                        }
                    );
                    return finalResponse;
                }
            } catch (error) {
                logger.error("Rate Limiter Error", { error: error instanceof Error ? error.message : String(error) });
                if (isCriticalRoute) {
                    finalResponse = NextResponse.json(
                        { success: false, error: { code: "SERVICE_UNAVAILABLE", message: "Service temporarily unavailable" } },
                        { status: 503 }
                    );
                    return finalResponse;
                }
            }
        }
    }

        // ── 3. Build response with CORS headers ───────────────────────
        finalResponse = NextResponse.next();
        addCorsHeaders(finalResponse, origin);

        // Request Correlation ID
        finalResponse.headers.set("X-Request-Id", requestId);

        // Rate limit info headers
        if (rateLimitInfo) {
            finalResponse.headers.set("X-RateLimit-Limit", rateLimitInfo.limit.toString());
            finalResponse.headers.set(
                "X-RateLimit-Remaining",
                rateLimitInfo.remaining.toString()
            );
            finalResponse.headers.set(
                "X-RateLimit-Reset",
                rateLimitInfo.reset.toString()
            );
        }
    } catch (error) {
        logger.error("Unhandled API error", {
            error,
            requestId,
            route,
            userId,
        });
        finalResponse = NextResponse.json(
            { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
            { status: 500 }
        );
        addCorsHeaders(finalResponse, request.headers.get("origin"));
        finalResponse.headers.set("X-Request-Id", requestId);
    } finally {
        if (pathname.startsWith("/api/")) {
            const latencyMs = Date.now() - start;
            logger.info("API Request Completed", {
                requestId,
                userId,
                route,
                latencyMs,
                statusCode: finalResponse!.status,
            });
        }
    }

    return finalResponse;
}

// ─── Matcher ────────────────────────────────────────────────────────────────

export const config = {
    matcher: ["/api/:path*"],
};
