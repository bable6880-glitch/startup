'use client'

import ReviewCard from './ReviewCard'

interface ReviewItem {
    id: string
    rating: number
    comment: string | null
    createdAt: string
    isVerifiedPurchase: boolean
    sellerReply: string | null
    sellerRepliedAt?: string | null
    user?: {
        name: string | null
        avatarUrl: string | null
    } | null
}

interface ReviewListProps {
    reviews: ReviewItem[]
    emptyMessage?: string
    onReply?: (reviewId: string) => void
}

export default function ReviewList({ reviews, emptyMessage, onReply }: ReviewListProps) {
    const topReviews = reviews.slice(0, 3)
    const moreReviews = reviews.slice(3)

    if (reviews.length === 0) {
        return (
            <p className="text-neutral-400 dark:text-neutral-500 text-sm text-center py-8">
                {emptyMessage ?? 'No reviews yet. Be the first to review!'}
            </p>
        )
    }

    return (
        <div className="space-y-4">
            {/* Always visible top 3 */}
            <div className="space-y-3">
                {topReviews.map(review => (
                    <ReviewCard key={review.id} review={review} onReply={onReply} />
                ))}
            </div>

            {/* Scrollable remaining reviews */}
            {moreReviews.length > 0 && (
                <div>
                    <div className="flex items-center gap-2 mb-3 mt-4">
                        <div className="h-px flex-1 bg-neutral-100 dark:bg-neutral-700" />
                        <span className="text-xs text-neutral-400 dark:text-neutral-500 font-medium px-2 whitespace-nowrap">
                            {moreReviews.length} more review{moreReviews.length > 1 ? 's' : ''}
                        </span>
                        <div className="h-px flex-1 bg-neutral-100 dark:bg-neutral-700" />
                    </div>
                    <div
                        className="review-scroll-container overflow-y-auto space-y-3 pr-1"
                        style={{ maxHeight: '400px' }}
                    >
                        {moreReviews.map(review => (
                            <ReviewCard key={review.id} review={review} onReply={onReply} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
