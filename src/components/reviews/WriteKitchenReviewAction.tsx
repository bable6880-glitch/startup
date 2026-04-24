'use client'

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/firebase/auth-context';
import { Loader2 } from 'lucide-react';
import WriteReviewModal from './WriteReviewModal';

export default function WriteKitchenReviewAction({ kitchenId, kitchenName }: { kitchenId: string, kitchenName: string }) {
    const { user, getIdToken } = useAuth();
    const [status, setStatus] = useState<'loading'|'checked'>('loading');
    const [canReview, setCanReview] = useState(false);
    const [orderId, setOrderId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [justSubmitted, setJustSubmitted] = useState(false);
    
    useEffect(() => {
        const checkEligibility = async () => {
            try {
                const token = await getIdToken();
                if (!token) {
                    setStatus('checked');
                    return;
                }
                const res = await fetch(`/api/reviews/check?kitchenId=${kitchenId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    setCanReview(data.data?.canReview || false);
                    setOrderId(data.data?.orderId || null);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setStatus('checked');
            }
        };
        if (user) {
            checkEligibility();
        } else {
            setStatus('checked');
        }
    }, [kitchenId, user, getIdToken]);

    if (status === 'loading') {
        return <div className="text-gray-400 text-sm flex items-center mt-6"><Loader2 className="w-4 h-4 animate-spin mr-2"/> Checking review eligibility...</div>;
    }

    if (justSubmitted) {
        return (
            <div className="mt-6 rounded-xl bg-green-50 p-4 border border-green-100 dark:bg-green-900/10 dark:border-green-900/30 text-center">
                <span className="text-2xl block mb-2">🎉</span>
                <p className="text-sm font-semibold text-green-700 dark:text-green-300">Your review has been submitted! ✓</p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">Your feedback helps our community.</p>
                <button
                    onClick={() => {
                        setJustSubmitted(false);
                    }}
                    className="mt-3 text-xs text-primary-600 hover:text-primary-700 font-medium dark:text-primary-400"
                >
                    Write another review
                </button>
            </div>
        );
    }

    if (canReview && orderId) {
        return (
            <div className="mt-6">
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white font-semibold rounded-xl shadow-sm hover:bg-orange-600 transition-colors w-full sm:w-auto justify-center"
                >
                    ★ Write a Review
                </button>
                
                <WriteReviewModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={() => {
                        setJustSubmitted(true);
                        setIsModalOpen(false);
                    }}
                    kitchenId={kitchenId}
                    kitchenName={kitchenName}
                    orderId={orderId}
                />
            </div>
        );
    }

    return null;
}
