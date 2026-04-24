"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface BackButtonProps {
    label?: string;
    fallbackPath?: string;
    className?: string;
}

export function BackButton({ label = "Back", fallbackPath, className }: BackButtonProps) {
    const router = useRouter();

    const handleBack = () => {
        // Check if there is history to go back to
        if (window.history.length > 1) {
            router.back();
        } else if (fallbackPath) {
            router.push(fallbackPath);
        } else {
            router.push("/dashboard");
        }
    };

    return (
        <button
            onClick={handleBack}
            className={cn(
                "inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors group min-h-[44px]",
                className
            )}
            aria-label={label}
        >
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4 transition-transform group-hover:-translate-x-0.5"
            >
                <path d="m15 18-6-6 6-6" />
            </svg>
            <span>{label}</span>
        </button>
    );
}
