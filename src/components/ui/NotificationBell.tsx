"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/firebase/auth-context";

interface Notification {
    id: string;
    type: string;
    title: string;
    body: string | null;
    isRead: boolean;
    createdAt: string;
}

function getNotificationColor(type: string): string {
    const colors: Record<string, string> = {
        ORDER_PLACED: "bg-blue-100 text-blue-600",
        ORDER_ACCEPTED: "bg-green-100 text-green-600",
        ORDER_COMPLETED: "bg-purple-100 text-purple-600",
        ORDER_CANCELLED: "bg-red-100 text-red-600",
        MENU_RESET: "bg-orange-100 text-orange-600",
        REVIEW_REPLY: "bg-indigo-100 text-indigo-600",
        NEW_REVIEW: "bg-yellow-100 text-yellow-600",
        DEFAULT: "bg-gray-100 text-gray-600",
    };
    return colors[type] ?? colors.DEFAULT;
}

function getNotificationIcon(type: string): string {
    const icons: Record<string, string> = {
        ORDER_PLACED: "🛍️",
        ORDER_ACCEPTED: "✅",
        ORDER_COMPLETED: "🎉",
        ORDER_CANCELLED: "❌",
        MENU_RESET: "🔄",
        REVIEW_REPLY: "💬",
        NEW_REVIEW: "⭐",
        DEFAULT: "🔔",
    };
    return icons[type] ?? icons.DEFAULT;
}

function timeAgo(dateString: string) {
    const date = new Date(dateString);
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
}

function NotificationItem({ notification, onRead }: { notification: Notification; onRead: () => void }) {
    const isUnread = !notification.isRead;

    return (
        <div
            onClick={onRead}
            className={cn(
                "px-4 py-3 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors",
                isUnread && "bg-orange-50/50"
            )}
        >
            <div className="flex gap-3">
                <div
                    className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm",
                        getNotificationColor(notification.type)
                    )}
                >
                    {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                    <p className={cn("text-sm text-gray-800 leading-snug", isUnread && "font-medium")}>
                        {notification.title}
                    </p>
                    {notification.body && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{notification.body}</p>
                    )}
                    <p className="text-xs text-gray-300 mt-1">{timeAgo(notification.createdAt)}</p>
                </div>
                {isUnread && <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0 mt-1.5" />}
            </div>
        </div>
    );
}

export function NotificationBell() {
    const { user, getIdToken } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [clearing, setClearing] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchNotifications = async () => {
        if (!user) return;
        try {
            setLoading(true);
            const token = await getIdToken();
            const res = await fetch("/api/account/notifications?page=1&limit=20", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.data ?? []);
                const count = (data.data ?? []).filter((n: Notification) => !n.isRead).length;
                setUnreadCount(count);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && notifications.length === 0) {
            fetchNotifications();
        }
    }, [isOpen]);

    useEffect(() => {
        if (!user) return;
        // Initial count fetch without full list
        fetchNotifications();
    }, [user]);

    const handleClearAll = async () => {
        if (clearing || notifications.length === 0) return;
        setClearing(true);

        // Optimistic UI — clear immediately
        setNotifications([]);
        setUnreadCount(0);

        try {
            const token = await getIdToken();
            await fetch("/api/account/notifications/clear", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
        } catch {
            // If API fails, re-fetch to restore state
            fetchNotifications();
        } finally {
            setClearing(false);
        }
    };

    const markAsRead = (id: string) => {
        // Implement single read if needed, or it opens link
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
    };

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        }
        if (isOpen) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    // Mark all as read on open
    useEffect(() => {
        if (!isOpen || unreadCount === 0) return;
        const timer = setTimeout(async () => {
            const token = await getIdToken();
            await fetch("/api/account/notifications/read-all", { 
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            setUnreadCount(0);
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        }, 1000);
        return () => clearTimeout(timer);
    }, [isOpen, unreadCount]);

    // Polling fallback: refresh unread count every 60s
    useEffect(() => {
        if (!user) return;
        const interval = setInterval(() => {
            fetchNotifications();
        }, 60_000);
        return () => clearInterval(interval);
    }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!user) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-xl text-neutral-500 hover:text-primary-600 hover:bg-primary-50 transition-all dark:text-neutral-400 dark:hover:text-primary-400 dark:hover:bg-primary-900/20"
                aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
            >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                </svg>
                {unreadCount > 0 && (
                    <span
                        className={cn(
                            "absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none",
                            unreadCount > 99 && "min-w-[22px]"
                        )}
                    >
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                        <span className="font-semibold text-sm text-gray-800">Notifications</span>
                        {notifications.length > 0 && (
                            <button
                                onClick={handleClearAll}
                                disabled={clearing}
                                className="text-xs text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50 flex items-center gap-1"
                            >
                                {clearing ? "..." : "✕ Clear All"}
                            </button>
                        )}
                    </div>

                    <div className="overflow-y-auto max-h-96">
                        {loading ? (
                            <div className="space-y-3 p-4">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex gap-3 animate-pulse">
                                        <div className="w-8 h-8 bg-gray-100 rounded-full flex-shrink-0" />
                                        <div className="flex-1 space-y-1.5">
                                            <div className="h-3 bg-gray-100 rounded w-3/4" />
                                            <div className="h-2.5 bg-gray-100 rounded w-1/2" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="py-12 text-center">
                                <span className="text-3xl">🔔</span>
                                <p className="text-sm text-gray-400 mt-2">No notifications</p>
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <NotificationItem key={n.id} notification={n} onRead={() => markAsRead(n.id)} />
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
