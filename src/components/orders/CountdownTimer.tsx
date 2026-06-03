"use client";

import { useEffect, useState } from "react";

export function CountdownTimer({ acceptedAt, estimatedMinutes }: { acceptedAt: string, estimatedMinutes: number }) {
    const [timeLeft, setTimeLeft] = useState<string>("Loading...");
    const [progress, setProgress] = useState<number>(0);
    const [isLate, setIsLate] = useState(false);

    useEffect(() => {
        const targetTime = new Date(acceptedAt).getTime() + (estimatedMinutes * 60 * 1000);
        const startTime = new Date(acceptedAt).getTime();
        const totalDuration = targetTime - startTime;

        const updateTimer = () => {
            const now = Date.now();
            const diff = targetTime - now;

            if (diff <= 0) {
                // Time's up
                const lateDiff = now - targetTime;
                const m = Math.floor(lateDiff / 60000);
                const s = Math.floor((lateDiff % 60000) / 1000);
                setTimeLeft(`${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`);
                setProgress(100);
                setIsLate(true);
            } else {
                const m = Math.floor(diff / 60000);
                const s = Math.floor((diff % 60000) / 1000);
                setTimeLeft(`${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`);
                setProgress(Math.max(0, Math.min(100, ((now - startTime) / totalDuration) * 100)));
                setIsLate(false);
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [acceptedAt, estimatedMinutes]);

    // Circular progress ring parameters
    const RADIUS = 40;
    const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
    const strokeDashoffset = CIRCUMFERENCE - (progress / 100) * CIRCUMFERENCE;

    return (
        <div className="flex items-center gap-5">
            {/* Circular Progress Ring */}
            <div className="relative w-24 h-24 shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    {/* Background ring */}
                    <circle
                        cx="50" cy="50" r={RADIUS}
                        fill="none"
                        stroke="currentColor"
                        className="text-blue-100 dark:text-blue-900/30"
                        strokeWidth="6"
                    />
                    {/* Progress ring */}
                    <circle
                        cx="50" cy="50" r={RADIUS}
                        fill="none"
                        stroke="currentColor"
                        className={`transition-all duration-1000 ${isLate ? "text-red-500" : "text-blue-500"}`}
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={CIRCUMFERENCE}
                        strokeDashoffset={strokeDashoffset}
                    />
                </svg>
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`font-mono text-lg font-black leading-none ${isLate ? "text-red-600 dark:text-red-400" : "text-blue-900 dark:text-blue-100"}`}>
                        {isLate ? `+${timeLeft}` : timeLeft}
                    </span>
                    <span className="text-[9px] font-semibold uppercase tracking-wider text-neutral-400 mt-0.5">
                        {isLate ? "late" : "left"}
                    </span>
                </div>
            </div>

            {/* Right side info */}
            <div className="flex-1">
                <p className={`text-sm font-semibold mb-1 ${isLate ? "text-red-600 dark:text-red-400" : "text-blue-700 dark:text-blue-300"}`}>
                    {isLate ? "Running slightly behind" : "Your food is being prepared"}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Estimated: {estimatedMinutes} minutes
                </p>
                {/* Linear progress for context */}
                <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <div 
                        className={`h-full rounded-full transition-all duration-1000 linear ${isLate ? "bg-red-500" : "bg-blue-500"}`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                </div>
            </div>
        </div>
    );
}
