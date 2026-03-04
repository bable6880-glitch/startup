"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function KitchenError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("[Kitchen Page Error]", {
            message: error.message,
            digest: error.digest,
            stack: error.stack,
        });
    }, [error]);

    return (
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 text-center">
            <span className="text-5xl block mb-4">😕</span>
            <h2 className="text-xl font-semibold text-neutral-700 dark:text-neutral-300">
                Unable to load this kitchen
            </h2>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                {error.message || "An unexpected error occurred."}
            </p>
            <div className="mt-6 flex items-center justify-center gap-4">
                <button
                    onClick={reset}
                    className="rounded-xl bg-primary-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-600 transition-all active:scale-95"
                >
                    Try Again
                </button>
                <Link
                    href="/explore"
                    className="rounded-xl border border-neutral-200 px-6 py-2.5 text-sm font-medium text-neutral-600 hover:border-primary-300 hover:text-primary-600 transition-all dark:border-neutral-700 dark:text-neutral-400"
                >
                    ← Back to Explore
                </Link>
            </div>
            {error.digest && (
                <p className="mt-4 text-xs text-neutral-400">
                    Error ID: {error.digest}
                </p>
            )}
        </div>
    );
}
