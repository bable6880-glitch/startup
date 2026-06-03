"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, use } from "react";
import confetti from "canvas-confetti";

export default function OrderConfirmationPage(props: { params: Promise<{ id: string }> }) {
    const params = use(props.params);
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Replace the history state so that hitting 'back' takes the user to the previous page
        // instead of returning to the confirmation page.
        window.history.replaceState(null, "", `/orders/${params.id}`);

        // Fire confetti on mount
        const timer = setTimeout(() => {
            confetti({
                particleCount: 80,
                spread: 60,
                origin: { y: 0.65 },
                colors: ["#ea580c", "#f97316", "#22c55e", "#3b82f6", "#a855f7"],
            });
        }, 300);

        return () => clearTimeout(timer);
    }, [params.id]);

    if (!mounted) return null;

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-100 dark:border-neutral-800 p-8 text-center animate-scale-in">
                
                {/* Success checkmark */}
                <div className="mx-auto w-20 h-20 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center mb-6 animate-success-bounce">
                    <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                </div>
                
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Order placed!</h1>
                <p className="text-neutral-500 dark:text-neutral-400 mb-6">
                    We&apos;ve sent your request to the kitchen. You&apos;ll get a notification when they accept.
                </p>

                <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 mb-8 border border-neutral-100 dark:border-neutral-800">
                    <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.15em] mb-1">Order Number</p>
                    <p className="text-xl font-bold text-primary-600 dark:text-primary-400 font-mono tracking-wider">
                        #{params.id.slice(0, 8).toUpperCase()}
                    </p>
                </div>

                <div className="space-y-3">
                    <button
                        onClick={() => router.push(`/orders/${params.id}`)}
                        className="w-full min-h-[52px] rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-bold text-base transition-all shadow-lg shadow-primary-500/20 flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                        Track your order
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                    </button>
                    
                    <button
                        onClick={() => router.push("/explore")}
                        className="w-full min-h-[52px] rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold text-base transition-all flex items-center justify-center active:scale-[0.98]"
                    >
                        Continue browsing
                    </button>
                </div>
            </div>
        </div>
    );
}
