import StarRating from "./StarRating";
import { Flag, Reply } from "lucide-react";
import UserAvatar from "@/components/ui/UserAvatar";

interface ReviewCardProps {
    review: {
        id: string;
        rating: number;
        comment: string | null;
        createdAt: string;
        isVerifiedPurchase: boolean;
        sellerReply: string | null;
        sellerRepliedAt?: string | null;
        user?: {
            name: string | null;
            avatarUrl: string | null;
        } | null;
    };
    onReply?: (reviewId: string) => void;
}

function timeAgo(date: Date | string): string {
    const seconds = Math.floor(
        (Date.now() - new Date(date).getTime()) / 1000
    );
    if (seconds < 0) return 'just now';
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    if (seconds < 2592000) return `${Math.floor(seconds / 604800)}w ago`;
    return new Date(date).toLocaleDateString('en-PK', {
        month: 'short',
        day: 'numeric',
    });
}

function getRatingLabel(rating: number): string {
    if (rating === 5) return "Excellent";
    if (rating === 4) return "Great";
    if (rating === 3) return "Good";
    if (rating === 2) return "Fair";
    return "Poor";
}

export default function ReviewCard({ review, onReply }: ReviewCardProps) {
    const userName = review.user?.name || "Anonymous";
    const reviewTime = timeAgo(review.createdAt);

    return (
        <div className="group relative rounded-2xl border border-neutral-100 bg-white p-5 sm:p-6 transition-all duration-300 hover:shadow-lg hover:border-neutral-200/80 dark:bg-neutral-800 dark:border-neutral-700 dark:hover:border-neutral-600">

            {/* ─── Header Row ────────────────────────────────── */}
            <div className="flex items-start gap-3 sm:gap-4">
                {/* Avatar */}
                <UserAvatar
                    src={review.user?.avatarUrl}
                    name={review.user?.name}
                    size="md"
                    className="ring-2 ring-neutral-100 dark:ring-neutral-700"
                />

                {/* Name + Meta */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-neutral-900 dark:text-neutral-50 text-sm sm:text-base truncate">
                            {userName}
                        </span>
                        {review.isVerifiedPurchase && (
                            <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-100 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
                                ✓ Verified
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-neutral-400 dark:text-neutral-500">
                            {reviewTime}
                        </span>
                    </div>
                </div>

                {/* Report Button */}
                <button
                    className="flex-shrink-0 p-1.5 rounded-lg text-neutral-300 hover:text-neutral-500 hover:bg-neutral-100 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 dark:text-neutral-600 dark:hover:text-neutral-400 dark:hover:bg-neutral-700"
                    title="Report review"
                    aria-label="Report this review"
                >
                    <Flag className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* ─── Rating Row ────────────────────────────────── */}
            <div className="mt-3 flex items-center gap-2.5">
                <StarRating value={review.rating} size="sm" />
                <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                    {getRatingLabel(review.rating)}
                </span>
            </div>

            {/* ─── Comment ───────────────────────────────────── */}
            {review.comment && (
                <p className="mt-3 text-sm sm:text-[15px] leading-relaxed text-neutral-700 dark:text-neutral-300">
                    {review.comment}
                </p>
            )}

            {/* ─── Seller Reply ───────────────────────────────── */}
            {review.sellerReply && (
                <div className="mt-4 ml-2 sm:ml-4 p-3.5 sm:p-4 bg-primary-50/60 border-l-[3px] border-primary-400 rounded-r-xl dark:bg-primary-900/20 dark:border-primary-600">
                    <div className="flex items-center gap-1.5 mb-1.5">
                        <Reply className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
                        <span className="text-xs font-bold text-primary-700 dark:text-primary-300 uppercase tracking-wide">
                            🍳 Cook&apos;s Reply
                        </span>
                        {review.sellerRepliedAt && (
                            <span className="text-[10px] text-neutral-400 dark:text-neutral-500 ml-1">
                                · {timeAgo(review.sellerRepliedAt)}
                            </span>
                        )}
                    </div>
                    <p className="text-sm leading-relaxed text-primary-800 dark:text-primary-200">
                        {review.sellerReply}
                    </p>
                </div>
            )}

            {/* ─── Reply Action (Seller Dashboard) ────────────── */}
            {onReply && !review.sellerReply && (
                <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-700">
                    <button
                        onClick={() => onReply(review.id)}
                        className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl text-primary-600 bg-primary-50 hover:bg-primary-100 hover:text-primary-700 transition-all active:scale-95 dark:bg-primary-900/20 dark:text-primary-400 dark:hover:bg-primary-900/40"
                    >
                        <Reply className="w-4 h-4" />
                        Reply to customer
                    </button>
                </div>
            )}
        </div>
    );
}
