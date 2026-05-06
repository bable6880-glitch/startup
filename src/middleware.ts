import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE = "st_admin_session";

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Only protect /admin-portal routes
    const isAdminRoute = pathname.startsWith("/admin-portal");
    if (!isAdminRoute) return NextResponse.next();

    // Allow login and verify-otp pages
    const isPublicAdminRoute = 
        pathname === "/admin-portal/login" || 
        pathname === "/admin-portal/verify";
    
    if (isPublicAdminRoute) return NextResponse.next();

    const token = req.cookies.get(COOKIE)?.value;

    if (!token) {
        console.log(`[Middleware] No token found for ${pathname}. Redirecting to login.`);
        return NextResponse.redirect(new URL("/admin-portal/login", req.url));
    }

    try {
        const secret = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET);
        await jwtVerify(token, secret, {
            issuer: "smart-tiffin-admin",
            audience: "admin-portal",
        });

        // JWT is valid. 
        // Note: We don't check DB here to keep middleware fast. 
        // The API routes will use guardAdminPortal for strict DB session validation.
        return NextResponse.next();
    } catch (err) {
        console.error(`[Middleware] JWT verification failed for ${pathname}:`, err);
        const response = NextResponse.redirect(new URL("/admin-portal/login", req.url));
        // Clear the stale cookie
        response.cookies.delete(COOKIE);
        return response;
    }
}

export const config = {
    matcher: ["/admin-portal/:path*"],
};
