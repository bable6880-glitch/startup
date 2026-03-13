"use client";

import { useAuth } from "@/lib/firebase/auth-context";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

type Review = {
    id: string;
    rating: string;
    comment: string | null;
    sellerReply: string | null;
    createdAt: string;
    kitchen: {
        id: string;
        name: string;
    };
};

function StarRating({ rating, max = 5 }: { rating: number; max?: number }) {
    return (
        <div className="flex gap-0.5" aria-label={`${rating} out of ${max} stars`}>
            {Array.from({ length: max }).map((_, i) => (
                <svg
                    key={i}
                    className={`h-4 w-4 transition-colors ${
                        i < rating ? "text-amber-400" : "text-neutral-200 dark:text-neutral-700"
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
            ))}
        </div>
    );
}

function RatingBadge({ rating }: { rating: number }) {
    const color =
        rating >= 4
            ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
            : rating === 3
            ? "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
            : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400";
    return (
        <span className={`inline-flex items-center gap-0.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${color}`}>
            <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {rating}.0
        </span>
    );
}

function DeleteConfirmModal({
    onConfirm,
    onCancel,
    loading,
}: {
    onConfirm: () => void;
    onCancel: () => void;
    loading: boolean;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onCancel}
            />
            <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-neutral-800 animate-fade-in">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20">
                    <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">Delete Review?</h3>
                <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                    This action cannot be undone. The review will be permanently removed.
                </p>
                <div className="mt-6 flex gap-3">
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="flex-1 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600 transition-colors disabled:opacity-60"
                    >
                        {loading ? "Deleting…" : "Delete"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function MyReviewsPage() {
    const { user, getIdToken } = useAuth();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [filterRating, setFilterRating] = useState<number | null>(null);

    const fetchReviews = useCallback(async () => {
        if (!user) return;
        try {
            setError(null);
            const token = await getIdToken();
            const res = await fetch("/api/account/reviews", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Failed to fetch reviews");
            const data = await res.json();
            setReviews(data.data?.reviews || data.reviews || []);
        } catch (err) {
            console.error("Failed to load reviews", err);
            setError("Could not load your reviews. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [user, getIdToken]);

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

    const handleDeleteConfirmed = async () => {
        if (!confirmDeleteId) return;
        setDeletingId(confirmDeleteId);
        try {
            const token = await getIdToken();
            const res = await fetch(`/api/reviews/${confirmDeleteId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                setReviews((prev) => prev.filter((r) => r.id !== confirmDeleteId));
            } else {
                alert("Failed to delete review. Please try again.");
            }
        } catch (err) {
            console.error(err);
            alert("Something went wrong. Please try again.");
        } finally {
            setDeletingId(null);
            setConfirmDeleteId(null);
        }
    };

    const filteredReviews =
        filterRating !== null ? reviews.filter((r) => Number(r.rating) === filterRating) : reviews;

    const avgRating =
        reviews.length > 0
            ? (reviews.reduce((sum, r) => sum + Number(r.rating), 0) / reviews.length).toFixed(1)
            : null;

    return (
        <>
            {confirmDeleteId && (
                <DeleteConfirmModal
                    onConfirm={handleDeleteConfirmed}
                    onCancel={() => setConfirmDeleteId(null)}
                    loading={!!deletingId}
                />
            )}

            <div className="space-y-6">
                {/* Page Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">My Reviews</h1>
                        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                            {reviews.length > 0
                                ? `${reviews.length} review${reviews.length !== 1 ? "s" : ""} written`
                                : "Share your honest feedback with the community"}
                        </p>
                    </div>
                    {avgRating && (
                        <div className="flex flex-col items-center rounded-2xl border border-amber-100 bg-amber-50 px-5 py-3 dark:bg-amber-900/10 dark:border-amber-900/20">
                            <span className="text-2xl font-bold text-amber-500">{avgRating}</span>
                            <span className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">avg rating</span>
                        </div>
                    )}
                </div>

                {/* Rating Filter */}
                {reviews.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">Filter:</span>
                        <button
                            onClick={() => setFilterRating(null)}
                            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                                filterRating === null
                                    ? "bg-primary-500 text-white"
                                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400"
                            }`}
                        >
                            All ({reviews.length})
                        </button>
                        {[5, 4, 3, 2, 1].map((r) => {
                            const count = reviews.filter((rev) => Number(rev.rating) === r).length;
                            if (count === 0) return null;
                            return (
                                <button
                                    key={r}
                                    onClick={() => setFilterRating(filterRating === r ? null : r)}
                                    className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                                        filterRating === r
                                            ? "bg-amber-400 text-white"
                                            : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400"
                                    }`}
                                >
                                    ★ {r} ({count})
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* States */}
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-36 rounded-2xl bg-neutral-200 animate-pulse dark:bg-neutral-800" />
                        ))}
                    </div>
                ) : error ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900/30 dark:bg-red-900/10">
                        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        <button
                            onClick={fetchReviews}
                            className="mt-3 rounded-lg px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                ) : filteredReviews.length > 0 ? (
                    <div className="space-y-4">
                        {filteredReviews.map((review) => (
                            <article
                                key={review.id}
                                className="group relative rounded-2xl border border-neutral-200/60 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:bg-neutral-800 dark:border-neutral-700"
                            >
                                {/* Header Row */}
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-3 min-w-0">
                                        {/* Kitchen Avatar */}
                                        <div className="h-10 w-10 shrink-0 rounded-xl bg-primary-50 flex items-center justify-center text-base font-bold text-primary-600 dark:bg-primary-900/20 dark:text-primary-400">
                                            {review.kitchen.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <Link
                                                href={`/kitchen/${review.kitchen.id}`}
                                                className="block font-semibold text-neutral-900 hover:text-primary-600 transition-colors dark:text-neutral-100 dark:hover:text-primary-400 truncate"
                                            >
                                                {review.kitchen.name}
                                            </Link>
                                            <div className="mt-1 flex items-center gap-2 flex-wrap">
                                                <StarRating rating={Number(review.rating)} />
                                                <RatingBadge rating={Number(review.rating)} />
                                                <span className="text-xs text-neutral-400 dark:text-neutral-500">
                                                    {new Date(review.createdAt).toLocaleDateString("en-US", {
                                                        month: "short",
                                                        day: "numeric",
                                                        year: "numeric",
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Delete Button */}
                                    <button
                                        onClick={() => setConfirmDeleteId(review.id)}
                                        disabled={deletingId === review.id}
                                        className="shrink-0 p-1.5 text-neutral-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 dark:hover:bg-red-900/20 dark:text-neutral-600"
                                        aria-label="Delete review"
                                    >
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Comment */}
                                {review.comment ? (
                                    <p className="mt-3 text-sm text-neutral-600 leading-relaxed dark:text-neutral-300">
                                        &ldquo;{review.comment}&rdquo;
                                    </p>
                                ) : (
                                    <p className="mt-3 text-sm italic text-neutral-400 dark:text-neutral-500">
                                        No comment left.
                                    </p>
                                )}

                                {/* Seller Reply */}
                                {review.sellerReply && (
                                    <div className="mt-4 rounded-xl bg-primary-50/80 p-3 pl-4 border-l-2 border-primary-400 dark:bg-primary-900/10 dark:border-primary-700">
                                        <p className="mb-1 flex items-center gap-1.5 text-xs font-bold text-primary-700 dark:text-primary-400">
                                            <span>👨‍🍳</span> Kitchen&apos;s Reply
                                        </p>
                                        <p className="text-sm text-neutral-600 dark:text-neutral-300">
                                            &ldquo;{review.sellerReply}&rdquo;
                                        </p>
                                    </div>
                                )}
                            </article>
                        ))}
                    </div>
                ) : reviews.length > 0 ? (
                    // Has reviews but filter returns nothing
                    <div className="rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50/50 p-10 text-center dark:border-neutral-700 dark:bg-neutral-800/20">
                        <p className="text-neutral-500 dark:text-neutral-400">No reviews match this filter.</p>
                        <button
                            onClick={() => setFilterRating(null)}
                            className="mt-2 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
                        >
                            Clear filter
                        </button>
                    </div>
                ) : (
                    <div className="rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50/50 p-12 text-center dark:border-neutral-700 dark:bg-neutral-800/20">
                        <span className="text-5xl block mb-4">⭐</span>
                        <p className="text-base font-semibold text-neutral-700 dark:text-neutral-300">
                            No reviews written yet
                        </p>
                        <p className="mt-1 text-sm text-neutral-400 dark:text-neutral-500">
                            Share your experience to help others find the best home-cooked meals.
                        </p>
                        <Link
                            href="/account/orders"
                            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-medium text-primary-600 shadow-sm border border-neutral-200 hover:bg-neutral-50 transition-colors dark:bg-neutral-800 dark:text-primary-400 dark:border-neutral-700 dark:hover:bg-neutral-700"
                        >
                            View Past Orders →
                        </Link>
                    </div>
                )}
            </div>
        </>
    );
}
