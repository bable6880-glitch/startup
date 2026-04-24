'use client'

import { useState } from 'react'
import ReviewCard from './ReviewCard'

interface ReviewItem {
    id: string
    rating: number
    comment: string | null
    createdAt: string
    isVerifiedPurchase?: boolean
    sellerReply?: string | null
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
    const [showAll, setShowAll] = useState(false)
    const topReviews = reviews.slice(0, 4)
    const moreReviews = reviews.slice(4)

    if (reviews.length === 0) {
        return (
            <p className="text-neutral-400 dark:text-neutral-500 text-sm text-center py-8">
                {emptyMessage ?? 'No reviews yet. Be the first to review!'}
            </p>
        )
    }

    return (
        <div className="space-y-4">
            {/* Always visible top 4 */}
            <div className="space-y-3">
                {topReviews.map(review => (
                    <ReviewCard
                        key={review.id}
                        review={{
                            ...review,
                            isVerifiedPurchase: review.isVerifiedPurchase ?? false,
                            sellerReply: review.sellerReply ?? null,
                        }}
                        onReply={onReply}
                    />
                ))}
            </div>

            {/* Toggle button + scrollable remaining reviews */}
            {moreReviews.length > 0 && (
                <div>
                    {!showAll ? (
                        <button
                            onClick={() => setShowAll(true)}
                            className="w-full py-3 mt-2 flex items-center justify-center gap-2 text-sm font-semibold text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-xl transition-colors dark:bg-primary-900/20 dark:text-primary-400 dark:hover:bg-primary-900/30"
                        >
                            View all reviews ({reviews.length})
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    ) : (
                        <>
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
                                    <ReviewCard
                                        key={review.id}
                                        review={{
                                            ...review,
                                            isVerifiedPurchase: review.isVerifiedPurchase ?? false,
                                            sellerReply: review.sellerReply ?? null,
                                        }}
                                        onReply={onReply}
                                    />
                                ))}
                            </div>
                            <button
                                onClick={() => setShowAll(false)}
                                className="w-full py-2.5 mt-3 flex items-center justify-center gap-2 text-xs font-medium text-neutral-500 hover:text-neutral-700 transition-colors dark:text-neutral-400 dark:hover:text-neutral-300"
                            >
                                Show less
                                <svg className="w-3.5 h-3.5 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    )
}
