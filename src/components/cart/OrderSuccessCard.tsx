"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface OrderSuccessCardProps {
    orderId: string;
    customerName: string;
    customerPhone: string;
    onClose: () => void;
}

export function OrderSuccessCard({ orderId, customerName, customerPhone, onClose }: OrderSuccessCardProps) {
    const [isVisible, setIsVisible] = useState(false);
    const router = useRouter();
    const modalRef = useRef<HTMLDivElement>(null);

    // Shorten order ID for display
    const shortId = orderId.split("-")[0].toUpperCase();

    useEffect(() => {
        // Trigger mounting animation
        requestAnimationFrame(() => setIsVisible(true));

        // Auto dismiss after 5 seconds
        const timer = setTimeout(() => {
            handleClose();
        }, 5000);

        // Escape key to dismiss
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") handleClose();
        };

        window.addEventListener("keydown", handleKeyDown);
        
        // Trap focus inside modal
        if (modalRef.current) {
            modalRef.current.focus();
        }

        return () => {
            clearTimeout(timer);
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => {
            onClose();
            // Automatically push to order tracker after dismissing
            router.push(`/orders/${orderId}`);
        }, 300); // Wait for exit animation
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-all duration-300">
            <div 
                ref={modalRef}
                tabIndex={-1}
                role="dialog"
                aria-modal="true"
                aria-labelledby="success-title"
                className={`w-full max-w-sm rounded-[24px] bg-white p-6 shadow-2xl transition-all duration-300 dark:bg-neutral-900 ${
                    isVisible ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 translate-y-8"
                }`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Success Icon Animation */}
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-50 dark:bg-green-900/30">
                    <svg 
                        className={`h-10 w-10 text-green-500 transition-transform duration-500 delay-150 ${isVisible ? 'scale-100' : 'scale-0'}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth="3" 
                            d="M5 13l4 4L19 7" 
                        />
                    </svg>
                </div>

                <div className="text-center">
                    <h2 id="success-title" className="text-2xl font-bold text-neutral-900 dark:text-white">
                        Order Placed!
                    </h2>
                    <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                        Sit tight, we&apos;ve securely transmitted your order to the kitchen.
                    </p>
                </div>

                <div className="mt-6 rounded-2xl bg-neutral-50 p-4 border border-neutral-100 dark:bg-neutral-800 dark:border-neutral-700">
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-neutral-500 dark:text-neutral-400">Order ID</span>
                            <span className="font-mono font-bold text-neutral-900 dark:text-white">#{shortId}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-neutral-500 dark:text-neutral-400">Name</span>
                            <span className="font-medium text-neutral-900 dark:text-white truncate max-w-[150px]">{customerName}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-neutral-500 dark:text-neutral-400">Phone</span>
                            <span className="font-medium text-neutral-900 dark:text-white">{customerPhone}</span>
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleClose}
                    className="mt-6 w-full rounded-xl bg-primary-600 py-3.5 text-sm font-bold text-white shadow-md shadow-primary-500/20 transition-all hover:bg-primary-700 hover:shadow-lg active:scale-[0.98]"
                >
                    Track Order
                </button>
                
                <p className="mt-4 text-center text-[10px] text-neutral-400 dark:text-neutral-500 uppercase tracking-widest font-semibold">
                    Redirecting automatically...
                </p>
            </div>
        </div>
    );
}
