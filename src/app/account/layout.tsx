"use client";

import { useAuth } from "@/lib/firebase/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

export default function AccountLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

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
        { href: "/account", label: "My Account", icon: "👤" },
        { href: "/account/orders", label: "My Orders", icon: "📦" },
        { href: "/account/profile", label: "Profile Settings", icon: "⚙️" },
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
                                {item.label}
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