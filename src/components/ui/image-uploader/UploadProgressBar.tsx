import React from 'react';

interface UploadProgressBarProps {
    progress: number; // 0 to 100
    statusText?: string;
}

export function UploadProgressBar({ progress, statusText = 'Processing...' }: UploadProgressBarProps) {
    const clampedProgress = Math.min(Math.max(progress, 0), 100);

    return (
        <div className="w-full animate-fade-in">
            <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    {statusText}
                </span>
                <span className="text-xs font-bold text-orange-600 dark:text-orange-400">
                    {Math.round(clampedProgress)}%
                </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-neutral-800 rounded-full h-2.5 overflow-hidden shadow-inner">
                <div 
                    className="bg-orange-600 dark:bg-orange-500 h-2.5 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${clampedProgress}%` }}
                />
            </div>
        </div>
    );
}
