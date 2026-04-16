'use client'

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import WriteReviewModal from './WriteReviewModal';
import ReviewCard from './ReviewCard';

export default function WriteKitchenReviewAction({ kitchenId, kitchenName }: { kitchenId: string, kitchenName: string }) {
    const [status, setStatus] = useState<'loading'|'checked'>('loading');
    const [canReview, setCanReview] = useState(false);
    const [orderId, setOrderId] = useState<string | null>(null);
    const [existingReview, setExistingReview] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    useEffect(() => {
        const checkEligibility = async () => {
            try {
                const res = await fetch(`/api/reviews/check?kitchenId=${kitchenId}`);
                if (res.ok) {
                    const data = await res.json();
                    setCanReview(data.data?.canReview || false);
                    setOrderId(data.data?.orderId || null);
                    setExistingReview(data.data?.existingReview || null);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setStatus('checked');
            }
        };
        checkEligibility();
    }, [kitchenId]);

    if (status === 'loading') {
        return <div className="text-gray-400 text-sm flex items-center mt-6"><Loader2 className="w-4 h-4 animate-spin mr-2"/> Checking review eligibility...</div>;
    }

    if (existingReview) {
        return (
            <div className="mt-6 space-y-3">
                <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full border border-green-200">Your Review</span>
                <ReviewCard review={existingReview} />
            </div>
        );
    }

    if (canReview && orderId) {
        return (
            <div className="mt-6">
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg shadow-sm transition-colors"
                >
                    Rate your experience
                </button>
                
                <WriteReviewModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={() => window.location.reload()}
                    kitchenId={kitchenId}
                    kitchenName={kitchenName}
                    orderId={orderId}
                />
            </div>
        );
    }

    return null;
}
