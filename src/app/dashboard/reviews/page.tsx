"use client";

import { useAuth } from "@/lib/firebase/auth-context";
import { useEffect, useState } from "react";
import { Loader2, Reply } from "lucide-react";
import RatingBreakdown from "@/components/reviews/RatingBreakdown";
import ReviewCard from "@/components/reviews/ReviewCard";
import Link from "next/link";

export default function DashboardReviewsPage() {
    const { user, loading: authLoading, getIdToken } = useAuth();
    const [stats, setStats] = useState<any>(null);
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Reply state
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyText, setReplyText] = useState("");
    const [submittingReply, setSubmittingReply] = useState(false);

    useEffect(() => {
        const fetchReviewsData = async () => {
            if (!user) return;
            try {
                const token = await getIdToken();
                
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

    if (authLoading || loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-20">
                <span className="text-5xl mb-4 block">😕</span>
                <p className="text-red-500 font-medium">{error}</p>
                <Link href="/dashboard" className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-all dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300 mt-4 inline-block">Back to Dashboard</Link>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-5xl px-4 py-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-neutral-50 mb-8">Manage Customer Reviews</h1>

            {stats && stats.totalReviews > 0 ? (
                <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-sm border border-neutral-200/60 dark:border-neutral-700 p-8 mb-8">
                    <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-50 mb-6">Aggregate Rating</h2>
                    <div className="flex flex-col md:flex-row gap-12 items-center md:items-start">
                        <div className="flex flex-col items-center">
                            <span className="text-6xl font-black text-neutral-900 dark:text-white">{stats.averageRating.toFixed(1)}</span>
                            <span className="text-sm text-neutral-500 mt-2 font-medium">out of 5</span>
                        </div>
                        <div className="flex-1 w-full max-w-md">
                            <RatingBreakdown breakdown={stats.breakdown} totalReviews={stats.totalReviews} />
                        </div>
                    </div>
                </div>
            ) : null}

            <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-sm border border-neutral-200/60 dark:border-neutral-700 p-6">
                <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-50 mb-4">All Reviews ({reviews.length})</h2>
                
                {reviews.length === 0 ? (
                    <p className="text-neutral-500 italic text-center py-12 bg-neutral-50 dark:bg-neutral-900/50 rounded-xl">No reviews received yet.</p>
                ) : (
                    <div className="space-y-6">
                        {reviews.map(review => (
                            <div key={review.id} className="pt-6 border-t border-neutral-100 dark:border-neutral-700 first:border-0 first:pt-0">
                                <ReviewCard 
                                    review={review}
                                    onReply={(!review.sellerReply && review.comment) ? () => setReplyingTo(review.id) : undefined}
                                />
                                
                                {replyingTo === review.id && (
                                    <div className="mt-4 ml-12 p-4 bg-orange-50 dark:bg-orange-900/10 rounded-lg border border-orange-100 dark:border-orange-800 animate-in fade-in slide-in-from-top-2">
                                        <label className="text-sm font-semibold text-orange-900 dark:text-orange-300 mb-2 block flex items-center">
                                            <Reply className="w-4 h-4 mr-2" /> Write your public response
                                        </label>
                                        <textarea
                                            value={replyText}
                                            onChange={e => setReplyText(e.target.value)}
                                            maxLength={500}
                                            rows={3}
                                            className="w-full border border-orange-200 rounded-md p-3 text-sm focus:ring-2 focus:ring-orange-500 font-medium bg-white dark:bg-neutral-800 dark:border-neutral-600 dark:text-neutral-100 outline-none"
                                            placeholder="Thank the customer or address their concerns politely..."
                                        />
                                        <div className="mt-3 flex justify-end gap-2">
                                            <button 
                                                onClick={() => { setReplyingTo(null); setReplyText(""); }}
                                                className="px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-700 rounded-md transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                onClick={() => handleReplySubmit(review.id)}
                                                disabled={!replyText.trim() || submittingReply}
                                                className="px-4 py-2 text-sm font-medium bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 transition-colors flex items-center"
                                            >
                                                {submittingReply ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Post Reply"}
                                            </button>
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
