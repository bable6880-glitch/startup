"use client";

import { RoleGuard } from "@/components/auth/RoleGuard";
import { type ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
    return (
        <RoleGuard allowedRoles={["COOK", "ADMIN"]}>
            {/* SEO: Prevent search engines from indexing private seller pages */}
            <head>
                <meta name="robots" content="noindex,nofollow" />
                <title>Seller Dashboard – Manage Your Tiffin Service & Meal Delivery</title>
            </head>
            {children}
        </RoleGuard>
    );
}
