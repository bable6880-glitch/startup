"use client";

import { useAuth } from "@/lib/firebase/auth-context";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

type Notification = {
    id: string;
    title: string;
    body: string;
    isRead: boolean;
    createdAt: string;
    link?: string | null;
    type?: string | null;
};

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function notifIcon(type?: string | null): string {
    switch (type) {
        case "ORDER_UPDATE": return "📦";
        case "REVIEW": return "⭐";
        case "PROMO": return "🎉";
        case "SYSTEM": return "⚙️";
        default: return "🔔";
    }
}

function NotificationSkeleton() {
    return (
        <div className="space-y-3 animate-pulse">
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-3 rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-800">
                    <div className="h-10 w-10 rounded-xl bg-neutral-200 dark:bg-neutral-700 shrink-0" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 w-3/5 rounded bg-neutral-200 dark:bg-neutral-700" />
                        <div className="h-3 w-4/5 rounded bg-neutral-100 dark:bg-neutral-700/50" />
                        <div className="h-3 w-1/4 rounded bg-neutral-100 dark:bg-neutral-700/50" />
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function NotificationsPage() {
    const { user, getIdToken } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [markingAllRead, setMarkingAllRead] = useState(false);
    const [filter, setFilter] = useState<"all" | "unread">("all");

    // Pagination
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const LIMIT = 15;

    const fetchNotifications = useCallback(
        async (pg = page) => {
            if (!user) return;
            try {
                setError(null);
                const token = await getIdToken();
                const res = await fetch(`/api/account/notifications?page=${pg}&limit=${LIMIT}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) throw new Error("fetch failed");
                const data = await res.json();
                const items: Notification[] = data.data ?? [];
                setNotifications(items);
                setTotal(data.pagination?.total ?? items.length);
            } catch {
                setError("Could not load notifications. Please try again.");
            } finally {
                setLoading(false);
            }
        },
        [user, getIdToken, page]
    );

    useEffect(() => {
        fetchNotifications(page);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, user]);

    const markRead = useCallback(
        async (id: string) => {
            // Optimistic update
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
            );
            try {
                const token = await getIdToken();
                await fetch(`/api/account/notifications/${id}/read`, {
                    method: "PATCH",
                    headers: { Authorization: `Bearer ${token}` },
                });
            } catch {
                // Revert on error
                setNotifications((prev) =>
                    prev.map((n) => (n.id === id ? { ...n, isRead: false } : n))
                );
            }
        },
        [getIdToken]
    );

    const markAllRead = useCallback(async () => {
        setMarkingAllRead(true);
        try {
            const token = await getIdToken();
            await fetch("/api/account/notifications/read", {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}` },
            });
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        } catch {
            // silently fail
        } finally {
            setMarkingAllRead(false);
        }
    }, [getIdToken]);

    const unreadCount = notifications.filter((n) => !n.isRead).length;
    const displayed =
        filter === "unread" ? notifications.filter((n) => !n.isRead) : notifications;
    const totalPages = Math.ceil(total / LIMIT);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">Notifications</h1>
                    <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                        {unreadCount > 0 ? (
                            <span className="text-primary-600 dark:text-primary-400 font-medium">
                                {unreadCount} unread
                            </span>
                        ) : (
                            "All caught up!"
                        )}
                    </p>
                </div>
                {unreadCount > 0 && (
                    <button
                        onClick={markAllRead}
                        disabled={markingAllRead}
                        className="flex items-center gap-1.5 rounded-xl bg-primary-50 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-100 transition-colors disabled:opacity-60 dark:bg-primary-900/20 dark:text-primary-300 dark:hover:bg-primary-900/30"
                    >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {markingAllRead ? "Marking…" : "Mark all read"}
                    </button>
                )}
            </div>

            {/* Filter tabs */}
            <div className="flex gap-1 rounded-xl bg-neutral-100 p-1 w-fit dark:bg-neutral-800">
                {(["all", "unread"] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                            filter === f
                                ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-neutral-100"
                                : "text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300"
                        }`}
                    >
                        {f === "unread" && unreadCount > 0 ? `Unread (${unreadCount})` : f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {/* Content */}
            {loading ? (
                <NotificationSkeleton />
            ) : error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900/30 dark:bg-red-900/10">
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    <button
                        onClick={() => fetchNotifications(page)}
                        className="mt-3 rounded-lg px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 transition-colors dark:text-red-400 dark:hover:bg-red-900/20"
                    >
                        Try Again
                    </button>
                </div>
            ) : displayed.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50/50 p-12 text-center dark:border-neutral-700 dark:bg-neutral-800/20">
                    <span className="text-5xl block mb-4">🔔</span>
                    <p className="text-base font-semibold text-neutral-700 dark:text-neutral-300">
                        {filter === "unread" ? "No unread notifications" : "No notifications yet"}
                    </p>
                    <p className="mt-1 text-sm text-neutral-400 dark:text-neutral-500">
                        {filter === "unread"
                            ? "You've read everything — you're all caught up!"
                            : "Order notifications, promotions, and updates will appear here."}
                    </p>
                    {filter === "unread" && (
                        <button
                            onClick={() => setFilter("all")}
                            className="mt-4 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
                        >
                            View all notifications
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-2">
                    {displayed.map((notif) => {
                        const content = (
                            <div
                                className={`group flex gap-3 rounded-2xl border p-4 transition-all cursor-pointer ${
                                    notif.isRead
                                        ? "border-neutral-200/60 bg-white hover:border-neutral-300 dark:bg-neutral-800 dark:border-neutral-700"
                                        : "border-primary-200/60 bg-primary-50/40 hover:border-primary-300 dark:bg-primary-900/10 dark:border-primary-900/40"
                                }`}
                                onClick={() => !notif.isRead && markRead(notif.id)}
                            >
                                {/* Icon */}
                                <div
                                    className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center text-base ${
                                        notif.isRead
                                            ? "bg-neutral-100 dark:bg-neutral-700"
                                            : "bg-primary-100 dark:bg-primary-900/30"
                                    }`}
                                >
                                    {notifIcon(notif.type)}
                                </div>

                                {/* Body */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <p
                                            className={`text-sm leading-snug ${
                                                notif.isRead
                                                    ? "font-medium text-neutral-700 dark:text-neutral-300"
                                                    : "font-semibold text-neutral-900 dark:text-neutral-50"
                                            }`}
                                        >
                                            {notif.title}
                                        </p>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="text-xs text-neutral-400 dark:text-neutral-500">
                                                {timeAgo(notif.createdAt)}
                                            </span>
                                            {!notif.isRead && (
                                                <span className="h-2 w-2 rounded-full bg-primary-500 shrink-0" />
                                            )}
                                        </div>
                                    </div>
                                    <p className="mt-0.5 text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2">
                                        {notif.body}
                                    </p>
                                    {notif.link && (
                                        <span className="mt-1.5 inline-block text-xs font-medium text-primary-600 dark:text-primary-400 group-hover:underline">
                                            View details →
                                        </span>
                                    )}
                                </div>
                            </div>
                        );

                        return notif.link ? (
                            <Link key={notif.id} href={notif.link} onClick={() => !notif.isRead && markRead(notif.id)}>
                                {content}
                            </Link>
                        ) : (
                            <div key={notif.id}>{content}</div>
                        );
                    })}
                </div>
            )}

            {/* Pagination */}
            {!loading && !error && totalPages > 1 && filter === "all" && (
                <div className="flex items-center justify-between pt-2">
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        Page {page} of {totalPages}
                    </p>
                    <div className="flex gap-2">
                        <button
                            disabled={page <= 1}
                            onClick={() => setPage((p) => p - 1)}
                            className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                        >
                            ← Previous
                        </button>
                        <button
                            disabled={page >= totalPages}
                            onClick={() => { setPage((p) => p + 1); setLoading(true); }}
                            className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                        >
                            Next →
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
