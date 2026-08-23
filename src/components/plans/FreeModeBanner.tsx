"use client";

import React, { useState, useEffect, useRef } from "react";
import { freeModeEndDateLabel, isFreeModeActive } from "@/config/free-mode";
import { Sparkles, X, Crown, ChevronRight } from "lucide-react";
import Link from "next/link";

interface FreeModeBannerProps {
    className?: string;
    /** Optional duration before auto-hiding (in ms). Defaults to 5000ms. Set to 0 to disable auto-hide. */
    autoHideDuration?: number;
    /** Variant: 'fixed' (floating top toast) or 'inline' (within page flow) */
    variant?: "fixed" | "inline";
    /** Optional callback when dismissed */
    onDismiss?: () => void;
}

export function FreeModeBanner({
    className = "",
    autoHideDuration = 5000,
    variant = "fixed",
    onDismiss,
}: FreeModeBannerProps) {
    const [visible, setVisible] = useState(true);
    const [animatingOut, setAnimatingOut] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const remainingTimeRef = useRef(autoHideDuration);
    const lastTickRef = useRef<number>(Date.now());
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!isFreeModeActive()) {
            setVisible(false);
            return;
        }

        if (autoHideDuration <= 0) return;

        const updateTimer = () => {
            if (isPaused) {
                lastTickRef.current = Date.now();
                return;
            }

            const now = Date.now();
            const elapsed = now - lastTickRef.current;
            lastTickRef.current = now;
            remainingTimeRef.current -= elapsed;

            if (remainingTimeRef.current <= 0) {
                handleDismiss();
            }
        };

        const interval = setInterval(updateTimer, 100);
        return () => clearInterval(interval);
    }, [autoHideDuration, isPaused]);

    const handleDismiss = () => {
        setAnimatingOut(true);
        setTimeout(() => {
            setVisible(false);
            onDismiss?.();
        }, 350);
    };

    if (!visible || !isFreeModeActive()) {
        return null;
    }

    if (variant === "inline") {
        return (
            <div
                className={`relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/80 via-neutral-900/90 to-teal-950/80 p-6 sm:p-7 text-white shadow-2xl backdrop-blur-2xl transition-all duration-300 ${
                    animatingOut ? "opacity-0 scale-[0.98]" : "opacity-100 scale-100"
                } ${className}`}
            >
                {/* Background aura light effects */}
                <div className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-emerald-500/20 blur-3xl" />
                <div className="pointer-events-none absolute -right-20 -bottom-20 h-56 w-56 rounded-full bg-teal-500/20 blur-3xl" />

                <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                    <div className="flex items-start sm:items-center gap-4">
                        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 shadow-[0_0_20px_rgba(16,185,129,0.5)]">
                            <Crown className="h-6 w-6 text-white" />
                            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
                                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-100" />
                            </span>
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-extrabold uppercase tracking-wider text-emerald-300 border border-emerald-500/30">
                                    <Sparkles className="h-3 w-3 text-emerald-300 animate-spin-slow" />
                                    Elite Promotion Active
                                </span>
                            </div>
                            <h3 className="mt-1 text-base sm:text-lg font-black text-white tracking-tight">
                                Your kitchen is completely free until{" "}
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-amber-200">
                                    {freeModeEndDateLabel()}
                                </span>
                            </h3>
                            <p className="text-xs sm:text-sm text-neutral-300/90 mt-0.5">
                                Unlimited menu items, unlimited orders, 0% platform commission, and full AI tools unlocked.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                        <Link
                            href="/dashboard/subscription"
                            className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 px-4 py-2 text-xs font-bold text-white transition-all hover:scale-105 active:scale-95 shadow-sm"
                        >
                            View Perks <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                        <button
                            type="button"
                            onClick={handleDismiss}
                            className="rounded-xl p-2 text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                            aria-label="Dismiss banner"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Default "fixed" floating capsule banner
    return (
        <aside
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            aria-label="Promotion announcement"
            className={`fixed top-5 left-1/2 -translate-x-1/2 z-[90] w-[94%] max-w-xl transition-all duration-300 ease-out ${
                animatingOut
                    ? "opacity-0 -translate-y-6 scale-95 pointer-events-none"
                    : "opacity-100 translate-y-0 scale-100"
            } ${className}`}
        >
            <div className="relative overflow-hidden rounded-2xl border border-emerald-500/40 bg-neutral-950/90 shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_30px_rgba(16,185,129,0.25)] backdrop-blur-2xl ring-1 ring-white/10">
                {/* Top aura line */}
                <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-80" />

                <div className="flex items-center justify-between gap-3 px-4 py-3.5 sm:px-5 sm:py-3.5 text-white">
                    <div className="flex items-center gap-3.5 min-w-0">
                        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 shadow-md shadow-emerald-500/30">
                            <Crown className="h-5 w-5 text-amber-200" />
                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-300" />
                            </span>
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <span className="inline-block rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-300 border border-emerald-500/30">
                                    Free Elite Mode
                                </span>
                                <span className="hidden sm:inline-block text-[11px] text-neutral-400">
                                    0% Commission · No Limits
                                </span>
                            </div>
                            <p className="text-xs sm:text-sm font-bold text-white tracking-tight truncate mt-0.5">
                                Your kitchen is free until{" "}
                                <span className="text-emerald-300 font-extrabold">
                                    {freeModeEndDateLabel()}
                                </span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <Link
                            href="/dashboard/subscription"
                            className="hidden sm:inline-flex items-center gap-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 px-2.5 py-1 text-[11px] font-bold text-emerald-200 transition-colors"
                        >
                            Details <ChevronRight className="h-3 w-3" />
                        </Link>
                        <button
                            type="button"
                            onClick={handleDismiss}
                            className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-neutral-400 hover:text-white hover:bg-white/15 transition-colors"
                            aria-label="Dismiss banner"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>

                {/* Micro auto-dismiss progress bar */}
                {autoHideDuration > 0 && (
                    <div className="h-[2px] w-full bg-white/5 overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-emerald-400 to-teal-300 transition-all ease-linear"
                            style={{
                                width: `${Math.max(0, (remainingTimeRef.current / autoHideDuration) * 100)}%`,
                            }}
                        />
                    </div>
                )}
            </div>
        </aside>
    );
}
