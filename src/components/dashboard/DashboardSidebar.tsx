"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/firebase/auth-context";
import {
    LayoutDashboard,
    ShoppingBag,
    UtensilsCrossed,
    Star,
    Settings,
    CreditCard,
    BookOpen,
    Zap,
    Bot,
    Flame,
    Search,
    Crown,
    ChevronLeft,
    ChevronRight,
    LogOut,
} from "lucide-react";

interface SidebarProps {
    kitchenName: string;
    collapsed: boolean;
    onToggle: () => void;
}

const navGroups = [
    {
        label: "Overview",
        links: [
            { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, exact: true },
        ],
    },
    {
        label: "Kitchen",
        links: [
            { name: "Orders",    href: "/dashboard/orders",       icon: ShoppingBag },
            { name: "Menu",      href: "/dashboard/menu",         icon: UtensilsCrossed },
            { name: "Reviews",   href: "/dashboard/reviews",      icon: Star },
            { name: "Potluck",   href: "/dashboard/potluck",      icon: Flame },
        ],
    },
    {
        label: "Business",
        links: [
            { name: "Analytics",    href: "/dashboard/analytics",    icon: LayoutDashboard },
            { name: "Khata",        href: "/dashboard/khata",        icon: BookOpen },
            { name: "Subscription", href: "/dashboard/subscription", icon: CreditCard },
            { name: "Boost",        href: "/dashboard/boost",        icon: Zap },
        ],
    },
    {
        label: "Tools",
        links: [
            { name: "Settings",  href: "/dashboard/settings",      icon: Settings },
            { name: "Browse",    href: "/explore",                  icon: Search },
        ],
    },
];

export function DashboardSidebar({ kitchenName, collapsed, onToggle }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { signOutUser } = useAuth();

    const isActive = (href: string, exact?: boolean) => {
        if (exact) return pathname === href;
        return pathname === href || pathname.startsWith(href + "/");
    };

    const handleLogout = async () => {
        await signOutUser();
        router.push("/");
    };

    return (
        <aside
            style={{
                width: collapsed ? 80 : 260,
                minWidth: collapsed ? 80 : 260,
                height: "100vh",
                background: "#161D31",
                borderRight: "1px solid rgba(255,255,255,0.06)",
                display: "flex",
                flexDirection: "column",
                position: "sticky",
                top: 0,
                transition: "width 0.25s ease, min-width 0.25s ease",
                overflow: "hidden",
                zIndex: 40,
                fontFamily: "var(--font-montserrat-var), 'Montserrat', sans-serif",
            }}
        >
            {/* Logo */}
            <div
                style={{
                    height: 62,
                    display: "flex",
                    alignItems: "center",
                    padding: collapsed ? "0 20px" : "0 20px",
                    justifyContent: collapsed ? "center" : "flex-start",
                    gap: 12,
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                    flexShrink: 0,
                }}
            >
                <div
                    style={{
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        background: "#7367F0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#ffffff",
                        fontWeight: 700,
                        fontSize: 14,
                        flexShrink: 0,
                    }}
                >
                    ST
                </div>
                {!collapsed && (
                    <div style={{ overflow: "hidden" }}>
                        <p style={{ margin: 0, color: "#D0D2D6", fontSize: 15, fontWeight: 600, whiteSpace: "nowrap" }}>
                            Smart Tiffin
                        </p>
                        <p style={{ margin: 0, color: "#676D7D", fontSize: 10, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 160 }}>
                            {kitchenName}
                        </p>
                    </div>
                )}
            </div>

            {/* Navigation */}
            <nav style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "12px 0" }}>
                {navGroups.map((group) => (
                    <div key={group.label} style={{ marginBottom: 8 }}>
                        {/* Section label */}
                        {!collapsed && (
                            <p className="dash-section-label">{group.label}</p>
                        )}
                        {collapsed && (
                            <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "8px 12px" }} />
                        )}

                        {/* Nav items */}
                        <div style={{ display: "flex", flexDirection: "column" }}>
                            {group.links.map((link) => {
                                const active = isActive(link.href, (link as any).exact);
                                const Icon = link.icon;
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        title={collapsed ? link.name : undefined}
                                        className={`dash-nav-item${active ? " active" : ""}`}
                                        style={{
                                            justifyContent: collapsed ? "center" : "flex-start",
                                            margin: "1px 8px",
                                            padding: "10px 12px",
                                        }}
                                    >
                                        <Icon
                                            size={18}
                                            style={{
                                                flexShrink: 0,
                                                color: active ? "#7367F0" : "currentColor",
                                            }}
                                        />
                                        {!collapsed && (
                                            <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                {link.name}
                                            </span>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}

                {/* Elite link */}
                {!collapsed && (
                    <div style={{ padding: "8px 8px 0" }}>
                        <Link
                            href="/dashboard/elite"
                            className="dash-nav-item"
                            style={{
                                margin: 0,
                                background: "rgba(115,103,240,0.08)",
                                border: "1px solid rgba(115,103,240,0.2)",
                            }}
                        >
                            <Crown size={18} style={{ color: "#9E95F5", flexShrink: 0 }} />
                            <span style={{ color: "#9E95F5", fontWeight: 600, fontSize: 12, letterSpacing: "0.3px" }}>
                                Elite Command
                            </span>
                        </Link>
                    </div>
                )}
            </nav>

            {/* Collapse toggle and Logout */}
            <div
                style={{
                    padding: "12px",
                    borderTop: "1px solid rgba(255,255,255,0.06)",
                    display: "flex",
                    justifyContent: collapsed ? "center" : "space-between",
                    alignItems: "center",
                    gap: "8px",
                }}
            >
                <button
                    onClick={handleLogout}
                    title="Logout"
                    style={{
                        width: collapsed ? 32 : "auto",
                        flex: collapsed ? "none" : 1,
                        height: 32,
                        borderRadius: 6,
                        background: "rgba(239,68,68,0.1)",
                        border: "1px solid rgba(239,68,68,0.2)",
                        color: "#ef4444",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        padding: collapsed ? 0 : "0 12px",
                        fontWeight: 600,
                        fontSize: 12,
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.background = "rgba(239,68,68,0.2)";
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.background = "rgba(239,68,68,0.1)";
                    }}
                    aria-label="Logout"
                >
                    <LogOut size={16} />
                    {!collapsed && <span>Logout</span>}
                </button>

                <button
                    onClick={onToggle}
                    style={{
                        width: 32,
                        height: 32,
                        borderRadius: 6,
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "#676D7D",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        flexShrink: 0,
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.background = "rgba(115,103,240,0.12)";
                        e.currentTarget.style.color = "#7367F0";
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                        e.currentTarget.style.color = "#676D7D";
                    }}
                    aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                    {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                </button>
            </div>
        </aside>
    );
}
