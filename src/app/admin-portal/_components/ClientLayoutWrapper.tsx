"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";

export function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isAuthPage = pathname.includes("/login") || pathname.includes("/verify");

    if (isAuthPage) {
        return <div style={{ position: "relative", zIndex: 1, height: "100%", overflow: "auto" }}>{children}</div>;
    }

    return (
        <div style={{ display: "flex", height: "100vh", overflow: "hidden", position: "relative", zIndex: 1 }}>
            <AdminSidebar />
            <div style={{ flex: 1, marginLeft: 260, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <AdminHeader />
                <main style={{ flex: 1, overflowY: "auto", padding: 40 }}>
                    {children}
                </main>
            </div>
        </div>
    );
}
