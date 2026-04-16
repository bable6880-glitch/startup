"use client";

import { useAuth } from "@/lib/firebase/auth-context";
import { useEffect, useState } from "react";
import { Loader2, Reply, Star, MessageSquare, ThumbsUp, Filter } from "lucide-react";
import RatingBreakdown from "@/components/reviews/RatingBreakdown";
import ReviewCard from "@/components/reviews/ReviewCard";
import Link from "next/link";

type ReviewFilter = "all" | "5" | "4" | "3" | "2" | "1" | "with_comment" | "no_reply";

export default function DashboardReviewsPage() {
    const { user, loading: authLoading, getIdToken } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState<ReviewFilter>("all");

    // Reply state
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyText, setReplyText] = useState("");
    const [submittingReply, setSubmittingReply] = useState(false);

    useEffect(() => {
        const fetchReviewsData = async () => {
            if (!user) return;
            try {
                const token = await getIdToken();
                if (!token) return;
                
                // Get Kitchen ID
                const kRes = await fetch("/api/kitchens?ownerId=me", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!kRes.ok) throw new Error("Failed to fetch kitchen");
                const kData = await kRes.json();
                const kitchenId = kData.data?.[0]?.id;
                
                if (!kitchenId) {
                    setError("No kitchen found. Please create one first.");
                    setLoading(false);
                    return;
                }

                // Fetch Reviews and Stats
                const rRes = await fetch(`/api/kitchens/${kitchenId}/reviews`);
                if (!rRes.ok) throw new Error("Failed to fetch reviews");
                const rData = await rRes.json();

                setReviews(rData.data || []);
                setStats(rData.stats || null);
            } catch (err: any) {
                setError(err.message || "Failed to load reviews");
            } finally {
                setLoading(false);
            }
        };

        if (!authLoading) {
            fetchReviewsData();
        }
    }, [user, authLoading, getIdToken]);

    const handleReplySubmit = async (reviewId: string) => {
        if (!replyText.trim()) return;
        setSubmittingReply(true);

        try {
            const token = await getIdToken();
            const res = await fetch("/api/reviews", {
                method: "PATCH",
                headers: { 
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}` 
                },
                body: JSON.stringify({ reviewId, reply: replyText })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Failed to submit reply");
            }

            // Update local state
            setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, sellerReply: replyText } : r));
            setReplyingTo(null);
            setReplyText("");
        } catch (err: any) {
            alert(err.message);
        } finally {
            setSubmittingReply(false);
        }
    };

    // Filter logic
    const filteredReviews = reviews.filter(review => {
        switch (activeFilter) {
            case "5": case "4": case "3": case "2": case "1":
                return review.rating === parseInt(activeFilter);
            case "with_comment":
                return review.comment && review.comment.trim().length > 0;
            case "no_reply":
                return !review.sellerReply && review.comment;
            default:
                return true;
        }
    });

    const filterOptions: { key: ReviewFilter; label: string; icon?: React.ReactNode; count?: number }[] = [
        { key: "all", label: "All", count: reviews.length },
        { key: "5", label: "5 Stars", icon: <span className="text-yellow-400">★</span>, count: reviews.filter(r => r.rating === 5).length },
        { key: "4", label: "4 Stars", icon: <span className="text-yellow-400">★</span>, count: reviews.filter(r => r.rating === 4).length },
        { key: "3", label: "3 Stars", icon: <span className="text-yellow-400">★</span>, count: reviews.filter(r => r.rating === 3).length },
        { key: "2", label: "2 Stars", icon: <span className="text-orange-400">★</span>, count: reviews.filter(r => r.rating === 2).length },
        { key: "1", label: "1 Star", icon: <span className="text-red-400">★</span>, count: reviews.filter(r => r.rating === 1).length },
        { key: "with_comment", label: "With Comments", icon: <MessageSquare className="w-3.5 h-3.5" /> },
        { key: "no_reply", label: "Needs Reply", icon: <Reply className="w-3.5 h-3.5" /> },
    ];

    if (authLoading || loading) {
        return (
            <div className="mx-auto max-w-5xl px-4 py-8">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 w-64 bg-neutral-200 rounded-lg dark:bg-neutral-700" />
                    <div className="h-48 bg-neutral-200 rounded-2xl dark:bg-neutral-700" />
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-32 rounded-xl bg-neutral-100 dark:bg-neutral-800" />)}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="mx-auto max-w-5xl px-4 py-16 text-center">
                <span className="text-5xl mb-4 block">😕</span>
                <p className="text-red-500 font-medium">{error}</p>
                <Link href="/dashboard" className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-all dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300 mt-4 inline-block">Back to Dashboard</Link>
            </div>
        );
    }

    const avgRating = stats?.averageRating ?? 0;
    const totalReviews = stats?.totalReviews ?? 0;

    return (
        <div className="mx-auto max-w-5xl px-4 py-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">Customer Reviews</h1>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Manage feedback and respond to your customers</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 rounded-full bg-primary-50 px-4 py-2 dark:bg-primary-900/20">
                        <Star className="w-4 h-4 text-primary-500 fill-primary-500" />
                        <span className="text-sm font-bold text-primary-700 dark:text-primary-300">
                            {avgRating > 0 ? avgRating.toFixed(1) : "—"}
                        </span>
                        <span className="text-xs text-primary-500 dark:text-primary-400">
                            ({totalReviews} {totalReviews === 1 ? "review" : "reviews"})
                        </span>
                    </div>
                </div>
            </div>

            {/* Stats Card */}
            {stats && totalReviews > 0 && (
                <div className="rounded-2xl border border-neutral-200/60 bg-white p-6 sm:p-8 shadow-sm mb-8 dark:bg-neutral-800 dark:border-neutral-700">
                    <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-center md:items-start">
                        {/* Big rating number */}
                        <div className="flex flex-col items-center shrink-0">
                            <span className="text-6xl font-black text-neutral-900 dark:text-white leading-none">
                                {avgRating.toFixed(1)}
                            </span>
                            <div className="flex items-center gap-0.5 mt-3">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <Star
                                        key={star}
                                        className={`w-5 h-5 ${star <= Math.round(avgRating) ? "text-yellow-400 fill-yellow-400" : "text-neutral-200 dark:text-neutral-600"}`}
                                    />
                                ))}
                            </div>
                            <span className="text-xs text-neutral-500 mt-2 font-medium dark:text-neutral-400">
                                {totalReviews} total {totalReviews === 1 ? "review" : "reviews"}
                            </span>
                        </div>

                        {/* Rating breakdown bars */}
                        <div className="flex-1 w-full max-w-md">
                            <RatingBreakdown breakdown={stats.breakdown} totalReviews={totalReviews} />
                        </div>

                        {/* Quick stats */}
                        <div className="flex flex-row md:flex-col gap-4 shrink-0">
                            <div className="text-center px-4 py-3 rounded-xl bg-green-50 dark:bg-green-900/20">
                                <ThumbsUp className="w-5 h-5 text-green-600 dark:text-green-400 mx-auto mb-1" />
                                <span className="text-lg font-bold text-green-700 dark:text-green-300 block">
                                    {reviews.filter(r => r.rating >= 4).length}
                                </span>
                                <span className="text-[10px] uppercase tracking-wider text-green-600 dark:text-green-400 font-semibold">Positive</span>
                            </div>
                            <div className="text-center px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20">
                                <MessageSquare className="w-5 h-5 text-amber-600 dark:text-amber-400 mx-auto mb-1" />
                                <span className="text-lg font-bold text-amber-700 dark:text-amber-300 block">
                                    {reviews.filter(r => !r.sellerReply && r.comment).length}
                                </span>
                                <span className="text-[10px] uppercase tracking-wider text-amber-600 dark:text-amber-400 font-semibold">Awaiting</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Filter Chips — horizontally scrollable */}
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                    <Filter className="w-4 h-4 text-neutral-400" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">Filter by</span>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
                    {filterOptions.map(opt => (
                        <button
                            key={opt.key}
                            onClick={() => setActiveFilter(opt.key)}
                            className={`shrink-0 flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-all whitespace-nowrap ${
                                activeFilter === opt.key
                                    ? "bg-primary-600 text-white shadow-md shadow-primary-500/20"
                                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                            }`}
                        >
                            {opt.icon}
                            {opt.label}
                            {opt.count !== undefined && (
                                <span className={`ml-1 text-[10px] ${activeFilter === opt.key ? "text-white/70" : "text-neutral-400 dark:text-neutral-500"}`}>
                                    {opt.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Reviews List */}
            <div className="rounded-2xl border border-neutral-200/60 bg-white shadow-sm dark:bg-neutral-800 dark:border-neutral-700">
                <div className="flex items-center justify-between p-5 border-b border-neutral-100 dark:border-neutral-700">
                    <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                        {activeFilter === "all" ? "All Reviews" : `Filtered Reviews`}
                        <span className="ml-2 text-sm font-normal text-neutral-400">({filteredReviews.length})</span>
                    </h2>
                </div>
                
                {filteredReviews.length === 0 ? (
                    <div className="text-center py-16 px-6">
                        <span className="text-4xl block mb-3">🔍</span>
                        <p className="text-neutral-500 dark:text-neutral-400 font-medium">
                            {reviews.length === 0 ? "No reviews received yet." : "No reviews match this filter."}
                        </p>
                        {reviews.length === 0 && (
                            <p className="text-xs text-neutral-400 mt-2 dark:text-neutral-500">
                                Reviews will appear here once customers rate their orders.
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="divide-y divide-neutral-100 dark:divide-neutral-700/50 max-h-[600px] overflow-y-auto">
                        {filteredReviews.map(review => (
                            <div key={review.id} className="p-5 hover:bg-neutral-50/50 dark:hover:bg-neutral-700/20 transition-colors">
                                <ReviewCard 
                                    review={review}
                                    onReply={(!review.sellerReply && review.comment) ? () => setReplyingTo(review.id) : undefined}
                                />
                                
                                {replyingTo === review.id && (
                                    <div className="mt-4 ml-8 sm:ml-12 p-4 bg-primary-50 dark:bg-primary-900/10 rounded-xl border border-primary-100 dark:border-primary-900/30">
                                        <label className="text-sm font-semibold text-primary-800 dark:text-primary-300 mb-2 flex items-center gap-2">
                                            <Reply className="w-4 h-4" /> Write your public response
                                        </label>
                                        <textarea
                                            value={replyText}
                                            onChange={e => setReplyText(e.target.value)}
                                            maxLength={500}
                                            rows={3}
                                            className="w-full border border-primary-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary-500 font-medium bg-white dark:bg-neutral-800 dark:border-neutral-600 dark:text-neutral-100 outline-none resize-none mt-2"
                                            placeholder="Thank the customer or address their concerns politely..."
                                            autoFocus
                                        />
                                        <div className="mt-3 flex items-center justify-between">
                                            <span className="text-[10px] text-neutral-400">{replyText.length}/500</span>
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => { setReplyingTo(null); setReplyText(""); }}
                                                    className="px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                                <button 
                                                    onClick={() => handleReplySubmit(review.id)}
                                                    disabled={!replyText.trim() || submittingReply}
                                                    className="px-5 py-2 text-sm font-bold bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center shadow-sm"
                                                >
                                                    {submittingReply ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                                    Post Reply
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
