import React from 'react';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: string;
    description?: string;
    trend?: {
        value: string;
        positive: boolean;
    };
}

export function StatCard({ title, value, icon, description, trend }: StatCardProps) {
    return (
        <div className="rounded-2xl border border-neutral-200/60 bg-white p-6 shadow-sm dark:bg-neutral-800 dark:border-neutral-700">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                        {title}
                    </p>
                    <p className="mt-2 text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
                        {value}
                    </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-2xl dark:bg-primary-900/40">
                    {icon}
                </div>
            </div>
            {(description || trend) && (
                <div className="mt-4 flex items-center gap-2 text-sm">
                    {trend && (
                        <span className={`font-medium ${trend.positive ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}>
                            {trend.value}
                        </span>
                    )}
                    {description && (
                        <span className="text-neutral-500 dark:text-neutral-400">
                            {description}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
