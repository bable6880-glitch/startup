import React from 'react';

interface SectionHeaderProps {
    title: string;
    description?: string;
    action?: React.ReactNode;
}

export function SectionHeader({ title, description, action }: SectionHeaderProps) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
                <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                    {title}
                </h2>
                {description && (
                    <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                        {description}
                    </p>
                )}
            </div>
            {action && (
                <div className="shrink-0">
                    {action}
                </div>
            )}
        </div>
    );
}
