"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
    LayoutDashboard, 
    Users, 
    ChefHat, 
    ShoppingBag, 
    AlertOctagon, 
    Wallet, 
    Settings, 
    Activity,
    LogOut
} from "lucide-react";

export function AdminSidebar() {
    const pathname = usePathname();

    const navGroups = [
        {
            title: "Overview",
            links: [
                { name: "Dashboard", href: "/admin-portal/dashboard", icon: <LayoutDashboard size={18} /> },
            ]
        },
        {
            title: "Management",
            links: [
                { name: "Users", href: "/admin-portal/users", icon: <Users size={18} /> },
                { name: "Kitchens", href: "/admin-portal/kitchens", icon: <ChefHat size={18} /> },
                { name: "Orders", href: "/admin-portal/orders", icon: <ShoppingBag size={18} /> },
                { name: "Reports", href: "/admin-portal/reports", icon: <AlertOctagon size={18} /> },
            ]
        },
        {
            title: "System",
            links: [
                { name: "Commission", href: "/admin-portal/commission", icon: <Wallet size={18} /> },
                { name: "Plans", href: "/admin-portal/plans", icon: <Settings size={18} /> },
                { name: "Audit Log", href: "/admin-portal/audit", icon: <Activity size={18} /> },
            ]
        }
    ];

    return (
        <aside
            style={{
                width: 260,
                height: "100vh",
                background: "rgba(10, 11, 13, 0.8)",
                backdropFilter: "blur(20px)",
                borderRight: "1px solid rgba(255,255,255,0.05)",
                display: "flex",
                flexDirection: "column",
                position: "fixed",
                left: 0,
                top: 0,
                zIndex: 50,
            }}
        >
            {/* Logo */}
            <div style={{ padding: "32px 24px", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    width: 36, height: 36, borderRadius: 10, background: "rgba(0,212,170,0.1)",
                    color: "#00D4AA", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace"
                }}>
                    ST
                </div>
                <div>
                    <h2 style={{ margin: 0, color: "#F0F2F5", fontSize: 15, fontWeight: 600 }}>Smart Tiffin</h2>
                    <p style={{ margin: 0, color: "#8B8FA8", fontSize: 11 }}>Command Center</p>
                </div>
            </div>

            {/* Navigation */}
            <div style={{ flex: 1, overflowY: "auto", padding: "0 16px" }}>
                {navGroups.map((group, i) => (
                    <div key={i} style={{ marginBottom: 24 }}>
                        <h3 style={{ 
                            padding: "0 12px", marginBottom: 8, color: "#4B5168", 
                            fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 
                        }}>
                            {group.title}
                        </h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            {group.links.map((link) => {
                                const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
                                return (
                                    <Link
                                        key={link.name}
                                        href={link.href}
                                        style={{
                                            display: "flex", alignItems: "center", gap: 12,
                                            padding: "10px 12px", borderRadius: 8,
                                            color: isActive ? "#00D4AA" : "#8B8FA8",
                                            background: isActive ? "rgba(0,212,170,0.1)" : "transparent",
                                            textDecoration: "none", fontSize: 14, fontWeight: 500,
                                            transition: "all 0.2s"
                                        }}
                                        onMouseOver={(e) => {
                                            if (!isActive) e.currentTarget.style.color = "#F0F2F5";
                                        }}
                                        onMouseOut={(e) => {
                                            if (!isActive) e.currentTarget.style.color = "#8B8FA8";
                                        }}
                                    >
                                        {link.icon}
                                        {link.name}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Bottom actions */}
            <div style={{ padding: 24, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                <form action="/api/admin-portal/auth/logout" method="POST">
                    <button
                        type="submit"
                        style={{
                            display: "flex", alignItems: "center", gap: 12,
                            width: "100%", padding: "10px 12px", borderRadius: 8,
                            background: "transparent", border: "none",
                            color: "#EF4444", fontSize: 14, fontWeight: 500,
                            cursor: "pointer", transition: "all 0.2s"
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = "rgba(239,68,68,0.1)"}
                        onMouseOut={(e) => e.currentTarget.style.background = "transparent"}
                        onClick={async (e) => {
                            e.preventDefault();
                            await fetch("/api/admin-portal/auth/logout", { method: "POST" });
                            window.location.href = "/admin-portal/login";
                        }}
                    >
                        <LogOut size={18} />
                        Logout
                    </button>
                </form>
            </div>
        </aside>
    );
}
