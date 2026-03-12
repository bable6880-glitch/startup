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

// ─── Proxy ──────────────────────────────────────────────────────────────────
// Next.js 16+ requires `proxy.ts` to export a function named `proxy`.

export async function proxy(request: NextRequest) {
    const requestId = randomUUID();
    const { pathname } = request.nextUrl;
    const ip = getClientIp(request);

    // Only apply to API routes
    if (!pathname.startsWith("/api/")) {
        return NextResponse.next();
    }

    logger.info("Incoming API Request", {
        requestId,
        method: request.method,
        path: pathname,
        ip,
    });

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

    // ── 2. Rate Limiting (Distributed) ─────────────────────────────────────────
    const limiterKey = getLimiterKey(pathname);
    const limiter = rateLimiters[limiterKey];

    let rateLimitInfo = null;

    if (limiter) {
        const ip = getClientIp(request);
        const identifier = `${ip}:${limiterKey}`;
        const { success, limit, remaining, reset } = await limiter.limit(identifier);

        rateLimitInfo = { limit, remaining, reset };

        if (!success) {
            return NextResponse.json(
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
        }
    }

    // ── 3. Build response with CORS headers ───────────────────────
    const response = NextResponse.next();
    addCorsHeaders(response, origin);

    // Request Correlation ID
    response.headers.set("X-Request-Id", requestId);

    // Rate limit info headers
    if (rateLimitInfo) {
        response.headers.set("X-RateLimit-Limit", rateLimitInfo.limit.toString());
        response.headers.set(
            "X-RateLimit-Remaining",
            rateLimitInfo.remaining.toString()
        );
        response.headers.set(
            "X-RateLimit-Reset",
            rateLimitInfo.reset.toString()
        );
    }

    return response;
}

// ─── Matcher ────────────────────────────────────────────────────────────────

export const config = {
    matcher: ["/api/:path*"],
};
