import StarRating from "./StarRating";
import { formatDistanceToNow } from "date-fns";
import { BadgeCheck, Flag, Reply } from "lucide-react";
import Image from "next/image";

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

function getInitials(name: string | null | undefined): string {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

function getAvatarColor(name: string | null | undefined): string {
    if (!name) return "from-neutral-300 to-neutral-400";
    const colors = [
        "from-orange-400 to-orange-500",
        "from-amber-400 to-amber-500",
        "from-emerald-400 to-emerald-500",
        "from-sky-400 to-sky-500",
        "from-violet-400 to-violet-500",
        "from-rose-400 to-rose-500",
        "from-teal-400 to-teal-500",
        "from-indigo-400 to-indigo-500",
    ];
    const hash = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return colors[hash % colors.length];
}

function getRatingLabel(rating: number): string {
    if (rating === 5) return "Excellent";
    if (rating === 4) return "Great";
    if (rating === 3) return "Good";
    if (rating === 2) return "Fair";
    return "Poor";
}

export default function ReviewCard({ review, onReply }: ReviewCardProps) {
    const initials = getInitials(review.user?.name);
    const avatarGradient = getAvatarColor(review.user?.name);
    const userName = review.user?.name || "Anonymous";
    const timeAgo = (() => {
        try {
            return formatDistanceToNow(new Date(review.createdAt), { addSuffix: true });
        } catch {
            return "recently";
        }
    })();

    return (
        <div className="group relative rounded-2xl border border-neutral-100 bg-white p-5 sm:p-6 transition-all duration-300 hover:shadow-lg hover:border-neutral-200/80 dark:bg-neutral-800 dark:border-neutral-700 dark:hover:border-neutral-600">

            {/* ─── Header Row ────────────────────────────────── */}
            <div className="flex items-start gap-3 sm:gap-4">
                {/* Avatar */}
                <div className="flex-shrink-0">
                    {review.user?.avatarUrl ? (
                        <Image
                            src={review.user.avatarUrl}
                            alt={`${userName}'s avatar`}
                            width={44}
                            height={44}
                            className="rounded-full object-cover ring-2 ring-neutral-100 dark:ring-neutral-700"
                        />
                    ) : (
                        <div
                            className={`w-11 h-11 rounded-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-white text-sm font-bold shadow-sm`}
                        >
                            {initials}
                        </div>
                    )}
                </div>

                {/* Name + Meta */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-neutral-900 dark:text-neutral-50 text-sm sm:text-base truncate">
                            {userName}
                        </span>
                        {review.isVerifiedPurchase && (
                            <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-accent-50 text-accent-700 border border-accent-200 dark:bg-accent-900/30 dark:text-accent-400 dark:border-accent-800">
                                <BadgeCheck className="w-3 h-3" strokeWidth={3} />
                                Verified
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-neutral-400 dark:text-neutral-500">
                            {timeAgo}
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
                            Cook&apos;s Reply
                        </span>
                        {review.sellerRepliedAt && (
                            <span className="text-[10px] text-neutral-400 dark:text-neutral-500 ml-1">
                                · {(() => { try { return formatDistanceToNow(new Date(review.sellerRepliedAt), { addSuffix: true }); } catch { return ""; } })()}
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
