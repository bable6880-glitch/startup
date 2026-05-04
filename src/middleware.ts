import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Protect all /admin-portal routes EXCEPT login and verify
    if (pathname.startsWith('/admin-portal')) {
        const isAuthRoute = pathname.startsWith('/admin-portal/login') || pathname.startsWith('/admin-portal/verify');
        const sessionCookie = request.cookies.get('st_admin_session');

        if (!isAuthRoute && !sessionCookie) {
            // Redirect unauthenticated users to the admin login page
            const url = request.nextUrl.clone();
            url.pathname = '/admin-portal/login';
            return NextResponse.redirect(url);
        }

        if (isAuthRoute && sessionCookie) {
            // Redirect authenticated users away from auth pages
            const url = request.nextUrl.clone();
            url.pathname = '/admin-portal/dashboard';
            return NextResponse.redirect(url);
        }
    }

    return NextResponse.next();
}

export const config = {
    // Only run middleware on /admin-portal routes to avoid performance impact on customer pages
    matcher: ['/admin-portal/:path*'],
};
