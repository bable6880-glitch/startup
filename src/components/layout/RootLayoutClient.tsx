"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { LocationModal } from "@/components/location/LocationModal";
import { LocationBanner } from "@/components/location/LocationBanner";
import { type ReactNode } from "react";

/**
 * Client wrapper that conditionally hides the public Navbar + Footer
 * on dashboard and admin-portal routes (those have their own chrome).
 * Zero functionality changes — only rendering of layout chrome.
 */
export function RootLayoutClient({ children }: { children: ReactNode }) {
    const pathname = usePathname();

    // Routes that render their own full-page shell (sidebar + topbar)
    const isDashboardRoute = pathname.startsWith("/dashboard");
    const isAdminPortalRoute = pathname.startsWith("/admin-portal");
    const hidePublicChrome = isDashboardRoute || isAdminPortalRoute;

    if (hidePublicChrome) {
        // Dashboard/admin-portal: render children directly — no navbar/footer
        // LocationModal/Banner still rendered in case auth modals need them
        return (
            <>
                {children}
                <LocationModal />
                <LocationBanner />
            </>
        );
    }

    return (
        <>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
            <LocationModal />
            <LocationBanner />
        </>
    );
}
