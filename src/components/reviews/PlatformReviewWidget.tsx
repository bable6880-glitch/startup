'use client'

import { useState, useEffect, useRef } from 'react';
import StarRating from './StarRating';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Loader2, MessageSquareText, ShieldCheck, X } from 'lucide-react';
import { useAuth } from '@/lib/firebase/auth-context';
import { ClientsSection } from '../ui/testimonial-card';

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
    const { user, getIdToken } = useAuth();
    const isLoggedIn = !!user;
    const [stats, setStats] = useState<PlatformStats | null>(null);
    const [kitchenCount, setKitchenCount] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const router = useRouter();

    const fetchStats = async () => {
        try {
            // Fetch review stats and platform stats in parallel
            const [reviewRes, platformRes] = await Promise.all([
                fetch('/api/reviews/platform'),
                fetch('/api/stats'),
            ]);
            if (reviewRes.ok) {
                const data = await reviewRes.json();
                setStats(data.data);
            }
            if (platformRes.ok) {
                const platformData = await platformRes.json();
                if (platformData?.data?.kitchens != null) {
                    setKitchenCount(platformData.data.kitchens);
                }
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

    const formatKitchenCount = (n: number): string => {
        if (n >= 1000) return `${Math.floor(n / 1000)}K+`;
        if (n >= 100) return `${Math.floor(n / 100) * 100}+`;
        if (n >= 10) return `${Math.floor(n / 10) * 10}+`;
        return String(n);
    };

    const mappedTestimonials = stats.recentReviews.map(r => ({
        id: r.id,
        name: r.user.name || "Anonymous",
        quote: r.comment,
        rating: r.rating,
        avatarSrc: r.user.avatarUrl,
        createdAt: r.createdAt
    }));

    const derivedStats = [
        { value: stats.totalReviews >= 100 ? "100+" : stats.totalReviews, label: "Happy Customers" },
        { value: stats.averageRating.toFixed(1), label: "Average Rating" },
        { value: kitchenCount != null ? formatKitchenCount(kitchenCount) : "—", label: "Active Kitchens" },
    ];
    return (
        <div id="platform-reviews" className="relative w-full overflow-hidden">
            <ClientsSection
                tagLabel="Real Voices"
                title="Loved by thousands across Pakistan"
                description="Our platform connects passionate home chefs with hungry professionals, creating a secure marketplace of authentic meals."
                stats={derivedStats}
                testimonials={mappedTestimonials}
                primaryActionLabel="Write a Review"
                onPrimaryAction={handleWriteReviewClick}
            />

            {/* Inlined Write Platform Review Modal */}
            {isModalOpen && (
                <PlatformReviewModal
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={() => {
                        setIsModalOpen(false);
                        fetchStats();
                    }}
                    getIdToken={getIdToken}
                />
            )}
        </div>
    );
}

function PlatformReviewModal({ onClose, onSuccess, getIdToken }: { onClose: () => void, onSuccess: () => void, getIdToken: () => Promise<string | null> }) {
    const [rating, setRating] = useState(0);
    const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
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
            const token = await getIdToken();
            if (!token) throw new Error("Authentication session expired.");

            const res = await fetch('/api/reviews/platform', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
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
