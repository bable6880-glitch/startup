'use client'

import { useState, useEffect, useRef } from 'react';
import StarRating from './StarRating';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Loader2, MessageSquareText, ShieldCheck, X } from 'lucide-react';
import { useAuth } from '@/lib/firebase/auth-context';

interface PlatformStats {
    averageRating: number;
    totalReviews: number;
    recentReviews: {
        id: string;
        rating: number;
        comment: string | null;
        createdAt: string;
        user: { name: string | null; avatarUrl: string | null };
    }[];
}

export default function PlatformReviewWidget() {
    const { user } = useAuth();
    const isLoggedIn = !!user;
    const [stats, setStats] = useState<PlatformStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const router = useRouter();

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/reviews/platform');
            if (res.ok) {
                const data = await res.json();
                setStats(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch platform stats', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const handleWriteReviewClick = () => {
        if (!isLoggedIn) {
            router.push('/login?redirect=/#platform-reviews');
            return;
        }
        setIsModalOpen(true);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
        );
    }

    if (!stats) return null;

    return (
        <div id="platform-reviews" className="bg-gradient-to-b from-white to-orange-50/50 py-16 px-4">
            <div className="max-w-4xl mx-auto text-center space-y-8">
                
                {/* Header Stats */}
                <div className="space-y-4">
                    <h2 className="text-3xl font-bold font-heading text-gray-900">
                        Loved by thousands across Pakistan
                    </h2>
                    
                    <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="flex items-end gap-3">
                            <span className="text-5xl font-black text-gray-900">
                                {stats.averageRating.toFixed(1)}
                            </span>
                            <div className="pb-1">
                                <StarRating value={Math.round(stats.averageRating)} size="lg" />
                            </div>
                        </div>
                        <p className="text-gray-600 font-medium flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-green-600" />
                            Based on {stats.totalReviews.toLocaleString()} reviews from real customers
                        </p>
                    </div>

                    <button 
                        onClick={handleWriteReviewClick}
                        className="mt-4 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 flex items-center gap-2 mx-auto"
                    >
                        <MessageSquareText className="w-5 h-5" />
                        Write a Review
                    </button>
                </div>

                {/* Recent Reviews Grid */}
                {stats.recentReviews.length > 0 && (
                    <div className="grid md:grid-cols-3 gap-6 pt-8 text-left">
                        {stats.recentReviews.slice(0, 3).map((review) => (
                            <div key={review.id} className="bg-white p-6 rounded-2xl shadow-sm border border-orange-100 flex flex-col h-full">
                                <StarRating value={review.rating} size="sm" />
                                <p className="mt-3 text-gray-700 text-sm leading-relaxed flex-grow italic">
                                    "{review.comment || 'Great experience with Smart Tiffin!'}"
                                </p>
                                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 flex justify-center items-center font-bold text-xs">
                                        {review.user.avatarUrl ? (
                                            <img src={review.user.avatarUrl} alt="avatar" className="rounded-full w-full h-full object-cover" />
                                        ) : review.user.name?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900 text-xs">{review.user.name || 'Anonymous'}</p>
                                        <p className="text-[10px] text-gray-400">
                                            {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Inlined Write Platform Review Modal */}
            {isModalOpen && (
                <PlatformReviewModal 
                    onClose={() => setIsModalOpen(false)} 
                    onSuccess={() => {
                        setIsModalOpen(false);
                        fetchStats();
                    }}
                />
            )}
        </div>
    );
}

function PlatformReviewModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
    const [rating, setRating] = useState(0);
    const [status, setStatus] = useState<'idle'|'loading'|'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [charCount, setCharCount] = useState(0);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleTextareaChange = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            if (textareaRef.current) setCharCount(textareaRef.current.value.length);
        }, 300);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) return;
        setStatus('loading');
        setErrorMessage('');

        const comment = textareaRef.current?.value.trim() || undefined;

        try {
            const res = await fetch('/api/reviews/platform', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rating, comment })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to submit review');

            onSuccess();
        } catch (error: any) {
            setStatus('error');
            setErrorMessage(error.message);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm px-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col">
                <div className="flex justify-between items-center p-5 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900">Review Smart Tiffin</h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 bg-gray-50 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <form id="platform-review-form" onSubmit={handleSubmit} className="p-5 space-y-6">
                    <div className="flex flex-col items-center">
                        <StarRating value={rating} onChange={setRating} size="lg" />
                    </div>

                    {errorMessage && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg text-center font-medium">
                            {errorMessage}
                        </div>
                    )}

                    <div className="space-y-2 text-left">
                        <label className="text-sm font-semibold text-gray-700">Add a comment <span className="font-normal text-gray-400">(Optional)</span></label>
                        <div className="relative">
                            <textarea
                                ref={textareaRef}
                                onChange={handleTextareaChange}
                                maxLength={500}
                                rows={4}
                                className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-orange-500 transition-shadow outline-none resize-none"
                                placeholder="How has Smart Tiffin helped you?"
                            />
                            <div className={`absolute bottom-3 right-3 text-xs font-medium ${charCount >= 500 ? 'text-red-500' : 'text-gray-400'}`}>
                                {charCount}/500
                            </div>
                        </div>
                    </div>
                </form>

                <div className="p-5 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                    <button
                        type="submit"
                        form="platform-review-form"
                        disabled={rating === 0 || status === 'loading'}
                        className="w-full py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 text-white font-semibold rounded-xl"
                    >
                        {status === 'loading' ? 'Submitting...' : 'Submit Platform Review'}
                    </button>
                </div>
            </div>
        </div>
    );
}
