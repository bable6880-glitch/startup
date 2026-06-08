"use client";

import { type ReactNode, useState } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";

interface DashboardShellProps {
    children: ReactNode;
    kitchenName?: string;
    userName?: string;
    userInitial?: string;
    connected?: boolean;
}

/**
 * Frest-inspired dark dashboard shell.
 * Wraps all /dashboard/* pages with the sidebar + topbar.
 * Does NOT touch any auth/data logic — purely visual.
 */
export function DashboardShell({
    children,
    kitchenName = "Your Kitchen",
    userName = "Chef",
    userInitial = "C",
    connected = false,
}: DashboardShellProps) {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div
            className="dash-layout"
            style={{
                display: "flex",
                height: "100vh",
                overflow: "hidden",
                background: "#0F1726",
                fontFamily: "var(--font-montserrat-var), 'Montserrat', sans-serif",
            }}
        >
            {/* Sidebar */}
            <DashboardSidebar
                kitchenName={kitchenName}
                collapsed={collapsed}
                onToggle={() => setCollapsed((c) => !c)}
            />

            {/* Main content area */}
            <div
                style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    overflow: "hidden",
                    minWidth: 0,
                }}
            >
                {/* Topbar */}
                <DashboardTopbar
                    kitchenName={kitchenName}
                    userName={userName}
                    userInitial={userInitial}
                    connected={connected}
                    onMenuToggle={() => setCollapsed((c) => !c)}
                />

                {/* Page content — scrollable */}
                <main
                    style={{
                        flex: 1,
                        overflowY: "auto",
                        overflowX: "hidden",
                        background: "#0F1726",
                    }}
                >
                    {children}
                </main>
            </div>
        </div>
    );
}
