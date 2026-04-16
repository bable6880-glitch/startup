'use client'

import { useState, useRef, useEffect } from 'react';
import StarRating from './StarRating';
import { X, Loader2 } from 'lucide-react';

interface WriteReviewModalProps {
    kitchenId: string;
    kitchenName: string;
    orderId: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function WriteReviewModal({
    kitchenId,
    kitchenName,
    orderId,
    isOpen,
    onClose,
    onSuccess
}: WriteReviewModalProps) {
    const [rating, setRating] = useState<number>(0);
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [charCount, setCharCount] = useState(0);
    
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Reset state when opened
    useEffect(() => {
        if (isOpen) {
            setRating(0);
            setStatus('idle');
            setErrorMessage('');
            setCharCount(0);
            if (textareaRef.current) textareaRef.current.value = '';
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleTextareaChange = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        
        timeoutRef.current = setTimeout(() => {
            if (textareaRef.current) {
                setCharCount(textareaRef.current.value.length);
            }
        }, 300); // Debounce to prevent immediate re-renders on every keystroke
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) return;

        setStatus('loading');
        setErrorMessage('');

        const comment = textareaRef.current?.value.trim() || undefined;

        try {
            const res = await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ kitchenId, orderId, rating, comment })
            });

            const data = await res.json();

            if (!res.ok) {
                if (res.status === 409) {
                    throw new Error("You've already reviewed this kitchen");
                }
                if (res.status === 403) {
                    throw new Error("You can only review completed orders");
                }
                throw new Error(data.message || 'Failed to submit review');
            }

            setStatus('success');
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 2000);
            
        } catch (error: any) {
            setStatus('error');
            setErrorMessage(error.message);
        }
    };

    if (status === 'success') {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-xl transform transition-all scale-100 opacity-100">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Thank You!</h3>
                    <p className="text-gray-600">Your review helps our community.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-5 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900">Rate your experience</h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="p-5 overflow-y-auto">
                    <p className="text-gray-600 text-sm mb-4">
                        How was your meal from <span className="font-semibold text-gray-900">{kitchenName}</span>?
                    </p>

                    <form id="review-form" onSubmit={handleSubmit} className="space-y-6">
                        <div className="flex flex-col items-center py-2">
                            <StarRating value={rating} onChange={setRating} size="lg" />
                            <p className="text-xs text-gray-500 mt-2 font-medium">
                                {rating === 0 ? "Select a rating" : rating === 5 ? "Excellent!" : rating >= 3 ? "Good" : "Needs Improvement"}
                            </p>
                        </div>

                        {errorMessage && (
                            <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg text-center font-medium">
                                {errorMessage}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700 block">
                                Add a comment <span className="text-gray-400 font-normal">(Optional)</span>
                            </label>
                            <div className="relative">
                                <textarea
                                    ref={textareaRef}
                                    onChange={handleTextareaChange}
                                    maxLength={500}
                                    rows={4}
                                    className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-shadow outline-none resize-none"
                                    placeholder="What did you like or dislike?"
                                />
                                <div className={`absolute bottom-3 right-3 text-xs font-medium ${charCount >= 500 ? 'text-red-500' : 'text-gray-400'}`}>
                                    {charCount}/500
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="p-5 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                    <button
                        type="submit"
                        form="review-form"
                        disabled={rating === 0 || status === 'loading'}
                        className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-sm transition-colors flex items-center justify-center"
                    >
                        {status === 'loading' ? (
                            <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Submitting...</>
                        ) : (
                            'Submit Review'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
