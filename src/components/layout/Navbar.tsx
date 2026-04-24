"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/lib/firebase/auth-context";

import { NotificationBell } from "@/components/ui/NotificationBell";

export default function Navbar() {
    const { user, loading, signOutUser, getIdToken } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const isCook = user?.role === "COOK" || user?.role === "ADMIN";
    const isCustomer = user?.role === "CUSTOMER";

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setProfileOpen(false);
            }
        }
        if (profileOpen) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [profileOpen]);

    // Notification count is now handled inside NotificationBell
    // The link badge in the customer dropdown will still be available but let's keep it simple
    // or we could remove it from here if we don't need it. For now, we'll keep unreadCount as 0 here.

    // Customer dropdown links
    const customerLinks = [
        { href: "/account", label: "My Account", icon: "👤" },
        { href: "/account/orders", label: "My Orders", icon: "📦" },
        { href: "/account/favorites", label: "Favorites", icon: "❤️" },
        { href: "/account/notifications", label: "Notifications", icon: "🔔", badge: unreadCount },
        { href: "/account/analytics", label: "Analytics", icon: "📈" },
    ];

    return (
        <header className="sticky top-0 z-[100] glass border-b border-neutral-200/50 dark:border-neutral-800/50">
            <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2.5 group transition-opacity hover:opacity-90">
                    <div className="relative h-10 w-10 sm:h-12 sm:w-12 overflow-hidden rounded-full border-2 border-primary-100 bg-white/50 shadow-sm transition-transform duration-300 group-hover:scale-105 dark:border-primary-900 dark:bg-neutral-800/50">
                        <Image
                            src="/smart-tiffin-logo.png"
                            alt="Smart Tiffin Logo"
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 40px, 48px"
                            priority
                        />
                    </div>
                    <span className="text-xl sm:text-2xl font-extrabold text-gradient tracking-tight">Smart Tiffin</span>
                </Link>

                {/* Desktop Nav */}
                <div className="hidden md:flex items-center gap-6">
                    <Link
                        href="/explore"
                        className="text-sm font-medium text-neutral-600 hover:text-primary-600 transition-colors dark:text-neutral-300 dark:hover:text-primary-400"
                    >
                        Explore Kitchens
                    </Link>

                    {loading ? (
                        <div className="h-8 w-20 rounded-lg animate-shimmer" />
                    ) : user ? (
                        <div className="flex items-center gap-3">
                            {/* Notification Bell — customers only */}
                            {isCustomer && <NotificationBell />}

                            {/* Avatar Dropdown */}
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    id="navbar-profile-btn"
                                    onClick={() => setProfileOpen((o) => !o)}
                                    className="flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-700 hover:bg-primary-100 transition-colors dark:bg-primary-900/30 dark:text-primary-300 dark:hover:bg-primary-900/50"
                                    aria-haspopup="true"
                                    aria-expanded={profileOpen}
                                >
                                    <span className="h-6 w-6 rounded-full bg-primary-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                                        {user.name?.[0]?.toUpperCase() || "U"}
                                    </span>
                                    <span className="hidden sm:inline">{user.name?.split(" ")[0] || "User"}</span>
                                    <svg
                                        className={`h-4 w-4 transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`}
                                        fill="none" viewBox="0 0 24 24" stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {profileOpen && (
                                    <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-white shadow-xl border border-neutral-200/60 py-2 animate-fade-in dark:bg-neutral-800 dark:border-neutral-700 ring-1 ring-black/5">
                                        {/* User info header */}
                                        <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-700">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-full bg-primary-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                                                    {user.name?.[0]?.toUpperCase() || "U"}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                                                        {user.name}
                                                    </p>
                                                    <p className="text-xs text-neutral-500 truncate">{user.email}</p>
                                                </div>
                                            </div>
                                            <span className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                isCook
                                                    ? "bg-accent-50 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300"
                                                    : "bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                                            }`}>
                                                {isCook ? "🍳 Cook" : "🛒 Customer"}
                                            </span>
                                        </div>

                                        {/* Customer links */}
                                        {isCustomer && (
                                            <div className="py-1">
                                                {customerLinks.map((item) => (
                                                    <Link
                                                        key={item.href}
                                                        href={item.href}
                                                        onClick={() => setProfileOpen(false)}
                                                        className="flex items-center justify-between px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors dark:text-neutral-300 dark:hover:bg-neutral-700"
                                                    >
                                                        <span className="flex items-center gap-2.5">
                                                            <span className="text-base">{item.icon}</span>
                                                            {item.label}
                                                        </span>
                                                        {item.badge ? (
                                                            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                                                                {item.badge > 99 ? "99+" : item.badge}
                                                            </span>
                                                        ) : null}
                                                    </Link>
                                                ))}
                                            </div>
                                        )}

                                        {/* Cook links */}
                                        {isCook && (
                                            <div className="py-1">
                                                <Link
                                                    href="/dashboard"
                                                    onClick={() => setProfileOpen(false)}
                                                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-700"
                                                >
                                                    <span className="text-base">🏠</span> Dashboard
                                                </Link>
                                                <Link
                                                    href="/dashboard/orders"
                                                    onClick={() => setProfileOpen(false)}
                                                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-700"
                                                >
                                                    <span className="text-base">📋</span> Kitchen Orders
                                                </Link>
                                            </div>
                                        )}

                                        {/* Admin link */}
                                        {user.role === "ADMIN" && (
                                            <div className="py-1 border-t border-neutral-100 dark:border-neutral-700">
                                                <Link
                                                    href="/admin"
                                                    onClick={() => setProfileOpen(false)}
                                                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-700"
                                                >
                                                    <span className="text-base">⚙️</span> Admin Panel
                                                </Link>
                                            </div>
                                        )}

                                        {/* Sign out */}
                                        <div className="border-t border-neutral-100 pt-1 dark:border-neutral-700">
                                            <button
                                                onClick={() => { setProfileOpen(false); signOutUser(); }}
                                                className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors dark:hover:bg-red-900/20"
                                            >
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                </svg>
                                                Sign Out
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <Link
                                href="/login"
                                className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-600 transition-all hover:shadow-md active:scale-95"
                            >
                                Sign In
                            </Link>
                            <Link
                                href="/seller/login"
                                className="rounded-lg border border-accent-500 px-4 py-2 text-sm font-semibold text-accent-600 hover:bg-accent-50 transition-all active:scale-95 dark:text-accent-400 dark:hover:bg-accent-900/20"
                            >
                                Cook Login
                            </Link>
                        </div>
                    )}
                </div>

                {/* Mobile: Bell + Menu Button */}
                <div className="flex items-center gap-2 md:hidden">
                    {isCustomer && !loading && <NotificationBell />}
                    <button
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                        aria-label="Toggle menu"
                    >
                        {mobileOpen ? (
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        )}
                    </button>
                </div>
            </nav>

            {/* Mobile Menu */}
            {mobileOpen && (
                <div className="md:hidden border-t border-neutral-200/50 bg-white/95 backdrop-blur-lg animate-fade-in dark:bg-neutral-900/95 dark:border-neutral-800/50">
                    <div className="px-4 py-3 space-y-1">
                        <Link
                            href="/explore"
                            onClick={() => setMobileOpen(false)}
                            className="block rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                        >
                            🍽️ Explore Kitchens
                        </Link>

                        {user ? (
                            <>
                                <div className="border-t border-neutral-200 my-2 dark:border-neutral-700" />

                                {/* Customer mobile links */}
                                {isCustomer && customerLinks.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setMobileOpen(false)}
                                        className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                                    >
                                        <span className="flex items-center gap-2">
                                            <span>{item.icon}</span>
                                            {item.label}
                                        </span>
                                        {item.badge ? (
                                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                                                {item.badge > 9 ? "9+" : item.badge}
                                            </span>
                                        ) : null}
                                    </Link>
                                ))}

                                {/* Cook mobile links */}
                                {isCook && (
                                    <>
                                        <Link
                                            href="/dashboard"
                                            onClick={() => setMobileOpen(false)}
                                            className="block rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                                        >
                                            🏠 Dashboard
                                        </Link>
                                        <Link
                                            href="/dashboard/orders"
                                            onClick={() => setMobileOpen(false)}
                                            className="block rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                                        >
                                            📋 Kitchen Orders
                                        </Link>
                                    </>
                                )}

                                <div className="border-t border-neutral-200 my-2 dark:border-neutral-700" />
                                <button
                                    onClick={() => { setMobileOpen(false); signOutUser(); }}
                                    className="w-full text-left rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                >
                                    Sign Out
                                </button>
                            </>
                        ) : (
                            <>
                                <Link
                                    href="/login"
                                    onClick={() => setMobileOpen(false)}
                                    className="block rounded-lg bg-primary-500 px-3 py-2.5 text-center text-sm font-semibold text-white hover:bg-primary-600 mt-2"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    href="/seller/login"
                                    onClick={() => setMobileOpen(false)}
                                    className="block rounded-lg border border-accent-500 px-3 py-2.5 text-center text-sm font-semibold text-accent-600 hover:bg-accent-50 mt-1 dark:text-accent-400"
                                >
                                    Cook Login
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}
