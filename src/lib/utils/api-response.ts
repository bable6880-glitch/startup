import { NextResponse } from "next/server";

export type ApiSuccessResponse<T = unknown> = {
    success: true;
    data: T;
    meta?: {
        page?: number;
        limit?: number;
        total?: number;
        hasMore?: boolean;
    };
};

export type ApiErrorResponse = {
    success: false;
    error: {
        code: string;
        message: string;
        details?: Record<string, string[]>;
        requestId?: string;
    };
};

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// ─── Success Responses ──────────────────────────────────────────────────────

export function apiSuccess<T>(data: T, status = 200) {
    return NextResponse.json<ApiSuccessResponse<T>>(
        { success: true, data },
        { status }
    );
}

export function apiPaginated<T>(
    data: T[],
    meta: { page: number; limit: number; total: number }
) {
    return NextResponse.json<ApiSuccessResponse<T[]>>(
        {
            success: true,
            data,
            meta: {
                ...meta,
                hasMore: meta.page * meta.limit < meta.total,
            },
        },
        { status: 200 }
    );
}

export function apiCreated<T>(data: T) {
    return apiSuccess(data, 201);
}

// ─── Error Responses ────────────────────────────────────────────────────────

export function apiError(
    message: string,
    code: string,
    status: number,
    details?: Record<string, string[]>,
    requestId?: string
) {
    return NextResponse.json<ApiErrorResponse>(
        { success: false, error: { code, message, details, requestId } },
        { status }
    );
}

export function apiBadRequest(message: string, details?: Record<string, string[]>) {
    return apiError(message, "BAD_REQUEST", 400, details);
}

export function apiUnauthorized(message = "Authentication required") {
    return apiError(message, "UNAUTHORIZED", 401);
}

export function apiForbidden(message = "Insufficient permissions") {
    return apiError(message, "FORBIDDEN", 403);
}

export function apiNotFound(message = "Resource not found") {
    return apiError(message, "NOT_FOUND", 404);
}

export function apiConflict(message: string) {
    return apiError(message, "CONFLICT", 409);
}

export function apiTooManyRequests(message = "Too many requests") {
    return apiError(message, "RATE_LIMITED", 429);
}

export function apiInternalError(message = "Internal server error") {
    return apiError(message, "INTERNAL_ERROR", 500);
}
