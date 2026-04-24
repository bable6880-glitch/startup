"use client";

import { useAuth } from "@/lib/firebase/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
    const { user, loading, getIdToken } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login?redirect=/account");
        }
        // Cooks go to /dashboard, admins go to /admin
        if (!loading && user?.role === "COOK") {
            router.push("/dashboard");
        }
        if (!loading && user?.role === "ADMIN") {
            router.push("/admin");
        }
    }, [user, loading, router]);

    // Fetch unread notifications count
    useEffect(() => {
        if (!user || user.role !== "CUSTOMER") return;

        let mounted = true;
        const fetchUnread = async () => {
            try {
                const token = await getIdToken();
                const res = await fetch("/api/account/notifications?limit=50", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!res.ok) return;
                const data = await res.json();
                
                // Count unread
                const count = (data.data || []).filter((n: any) => !n.isRead).length;
                if (mounted) setUnreadCount(count);
            } catch (_err) {
                // Ignore silent fetch errors
            }
        };

        fetchUnread();
        // Optional: set up an interval to poll every 60s
        const interval = setInterval(fetchUnread, 60000);
        return () => {
            mounted = false;
            clearInterval(interval);
        };
    }, [user, getIdToken]);

    if (loading || !user) {
        return (
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 w-48 bg-neutral-200 rounded-lg dark:bg-neutral-700" />
                    <div className="h-64 bg-neutral-200 rounded-2xl dark:bg-neutral-700" />
                </div>
            </div>
        );
    }

    const navItems = [
        { href: "/account", label: "Overview", icon: "📊" },
        { href: "/account/orders", label: "My Orders", icon: "📦" },
        { href: "/account/favorites", label: "Favorites", icon: "❤️" },
        { href: "/account/addresses", label: "Addresses", icon: "📍" },
        { href: "/account/reviews", label: "My Reviews", icon: "⭐" },
        { href: "/account/notifications", label: "Notifications", icon: "🔔", badge: unreadCount },
        { href: "/account/analytics", label: "Analytics", icon: "📈" },
        { href: "/account/profile", label: "Profile", icon: "👤" },
        { href: "/explore", label: "Explore Kitchens", icon: "🍽️" },
    ];

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {/* Mobile: top tab bar */}
            <div className="flex gap-1 mb-6 sm:hidden overflow-x-auto pb-1">
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-1.5 whitespace-nowrap px-3 py-2 rounded-lg text-sm font-medium transition-colors ${pathname === item.href
                                ? "bg-primary-500 text-white"
                                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300"
                            }`}
                    >
                        <span>{item.icon}</span>
                        {item.label}
                        {item.badge ? (
                            <span className="ml-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                                {item.badge > 99 ? "99+" : item.badge}
                            </span>
                        ) : null}
                    </Link>
                ))}
            </div>

            {/* Desktop: sidebar + content */}
            <div className="flex gap-8">
                {/* Sidebar */}
                <aside className="hidden sm:block w-56 shrink-0">
                    <nav className="space-y-1 sticky top-8">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${pathname === item.href
                                        ? "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                                        : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
                                    }`}
                            >
                                <span className="text-base">{item.icon}</span>
                                <span className="flex-1">{item.label}</span>
                                {item.badge ? (
                                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                                        {item.badge > 99 ? "99+" : item.badge}
                                    </span>
                                ) : null}
                            </Link>
                        ))}
                    </nav>
                </aside>

                {/* Page content */}
                <main className="flex-1 min-w-0">{children}</main>
            </div>
        </div>
    );
}