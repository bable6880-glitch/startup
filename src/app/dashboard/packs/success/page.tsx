'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';

function PackSuccessContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [countdown, setCountdown] = useState(3);
    const sessionId = searchParams.get('session_id');

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    router.push('/dashboard');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [router]);

    return (
        <div className="mx-auto max-w-lg px-4 py-16 text-center">
            <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-lg p-10 space-y-6">
                <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                    <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                </div>

                <h1 className="text-2xl font-black text-neutral-900 dark:text-white">
                    ✅ Pack Activated!
                </h1>
                <p className="text-neutral-500 dark:text-neutral-400">
                    Your extra capacity has been added to your plan. You can start using it immediately.
                </p>

                <p className="text-sm text-neutral-400">
                    Redirecting to dashboard in {countdown}s...
                </p>

                <button
                    onClick={() => router.push('/dashboard')}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white font-bold text-sm rounded-xl hover:bg-orange-600 transition-colors"
                >
                    Go to Dashboard →
                </button>
            </div>
        </div>
    );
}

export default function PackSuccessPage() {
    return (
        <Suspense fallback={
            <div className="mx-auto max-w-lg px-4 py-16 text-center">
                <div className="animate-pulse h-64 bg-neutral-100 rounded-3xl" />
            </div>
        }>
            <PackSuccessContent />
        </Suspense>
    );
}
