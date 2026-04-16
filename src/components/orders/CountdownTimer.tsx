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

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-sm">
                <span className={`font-semibold ${isLate ? "text-red-600 dark:text-red-400" : "text-blue-700 dark:text-blue-300"}`}>
                    {isLate ? "Running slightly behind:" : "Estimated time remaining:"}
                </span>
                <span className={`font-mono text-xl font-black ${isLate ? "text-red-600 dark:text-red-400" : "text-blue-900 dark:text-blue-100"}`}>
                    {isLate ? `+${timeLeft}` : timeLeft}
                </span>
            </div>
            
            <div className="h-2 w-full overflow-hidden rounded-full bg-blue-100 dark:bg-blue-900/30">
                <div 
                    className={`h-full transition-all duration-1000 linear ${isLate ? "bg-red-500" : "bg-blue-500"}`}
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
}
