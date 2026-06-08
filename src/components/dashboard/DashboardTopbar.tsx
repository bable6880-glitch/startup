"use client";

import { usePathname } from "next/navigation";
import { Bell, Menu } from "lucide-react";
import Link from "next/link";

interface DashboardTopbarProps {
    kitchenName: string;
    userName: string;
    userInitial: string;
    connected: boolean;
    onMenuToggle: () => void;
}

export function DashboardTopbar({
    kitchenName,
    userName,
    userInitial,
    connected,
    onMenuToggle,
}: DashboardTopbarProps) {
    const pathname = usePathname();

    // Build breadcrumb from path
    const segments = pathname.replace("/dashboard", "").split("/").filter(Boolean);
    const breadcrumbs = [
        { label: "Dashboard", href: "/dashboard" },
        ...segments.map((seg, i) => ({
            label: seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " "),
            href: "/dashboard/" + segments.slice(0, i + 1).join("/"),
        })),
    ];

    return (
        <header
            style={{
                height: 62,
                background: "#161D31",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 24px",
                position: "sticky",
                top: 0,
                zIndex: 30,
                flexShrink: 0,
                fontFamily: "var(--font-montserrat-var), 'Montserrat', sans-serif",
            }}
        >
            {/* Left: hamburger + breadcrumb */}
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <button
                    onClick={onMenuToggle}
                    style={{
                        width: 38,
                        height: 38,
                        borderRadius: 8,
                        background: "transparent",
                        border: "none",
                        color: "#D0D2D6",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        transition: "background 0.2s",
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
                    onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
                    aria-label="Toggle sidebar"
                >
                    <Menu size={20} />
                </button>

                {/* Breadcrumb */}
                <nav style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                    {breadcrumbs.map((crumb, i) => (
                        <span key={crumb.href} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            {i > 0 && (
                                <span style={{ color: "#676D7D" }}>{"›"}</span>
                            )}
                            <Link
                                href={crumb.href}
                                style={{
                                    color: i === breadcrumbs.length - 1 ? "#D0D2D6" : "#676D7D",
                                    textDecoration: "none",
                                    fontWeight: i === breadcrumbs.length - 1 ? 500 : 400,
                                    transition: "color 0.15s",
                                }}
                                onMouseOver={(e) => (e.currentTarget.style.color = "#7367F0")}
                                onMouseOut={(e) => (e.currentTarget.style.color = i === breadcrumbs.length - 1 ? "#D0D2D6" : "#676D7D")}
                            >
                                {crumb.label}
                            </Link>
                        </span>
                    ))}
                </nav>
            </div>

            {/* Right: SSE status + avatar */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>

                {/* Live status dot */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginRight: 8 }}>
                    {connected ? (
                        <>
                            <span style={{ position: "relative", display: "flex", width: 8, height: 8 }}>
                                <span style={{
                                    position: "absolute",
                                    inset: 0,
                                    borderRadius: "50%",
                                    background: "#28C76F",
                                    animation: "ping 1s cubic-bezier(0,0,0.2,1) infinite",
                                    opacity: 0.75,
                                }} />
                                <span style={{ position: "relative", width: 8, height: 8, borderRadius: "50%", background: "#28C76F" }} />
                            </span>
                            <span style={{ fontSize: 11, color: "#28C76F", fontWeight: 500 }}>Live</span>
                        </>
                    ) : (
                        <>
                            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#676D7D" }} />
                            <span style={{ fontSize: 11, color: "#676D7D" }}>Connecting…</span>
                        </>
                    )}
                </div>

                {/* Notification icon button */}
                <Link
                    href="/account/notifications"
                    style={{
                        width: 38,
                        height: 38,
                        borderRadius: 8,
                        background: "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#D0D2D6",
                        transition: "background 0.2s",
                        textDecoration: "none",
                        position: "relative",
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
                    onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
                >
                    <Bell size={18} />
                </Link>

                {/* Divider */}
                <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.08)", margin: "0 4px" }} />

                {/* User avatar + name */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ textAlign: "right", display: "none" }} className="sm:block">
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: "#D0D2D6", lineHeight: 1.3 }}>
                            {userName}
                        </p>
                        <p style={{ margin: 0, fontSize: 10, color: "#676D7D", lineHeight: 1.3 }}>
                            Kitchen Owner
                        </p>
                    </div>
                    <Link
                        href="/dashboard/settings"
                        style={{ position: "relative", display: "inline-flex" }}
                    >
                        <div style={{
                            width: 36,
                            height: 36,
                            borderRadius: "50%",
                            background: "linear-gradient(135deg, #7367F0, #9E95F5)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#ffffff",
                            fontWeight: 700,
                            fontSize: 14,
                            cursor: "pointer",
                            flexShrink: 0,
                        }}>
                            {userInitial}
                        </div>
                        {/* Online dot */}
                        <span style={{
                            position: "absolute",
                            bottom: 0,
                            right: 0,
                            width: 9,
                            height: 9,
                            borderRadius: "50%",
                            background: "#28C76F",
                            border: "2px solid #161D31",
                        }} />
                    </Link>
                </div>
            </div>
        </header>
    );
}
