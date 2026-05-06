import { cn } from "@/lib/utils";

interface PlanBadgeProps {
    planId: string | null;
    className?: string;
    showIcon?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

const PLAN_CONFIG: Record<string, { label: string, color: string, border: string, icon: string, glow?: string }> = {
    starter: {
        label: "Starter",
        color: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
        border: "border-blue-200 dark:border-blue-800",
        icon: "🌱"
    },
    growth: {
        label: "Growth",
        color: "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
        border: "border-orange-200 dark:border-orange-800",
        icon: "🚀"
    },
    pro: {
        label: "Pro",
        color: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
        border: "border-amber-200 dark:border-amber-800",
        icon: "⭐"
    },
    elite: {
        label: "Elite",
        color: "bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 dark:from-purple-900/30 dark:to-pink-900/30 dark:text-purple-400",
        border: "border-purple-300 dark:border-purple-700",
        icon: "👑",
        glow: "shadow-[0_0_8px_rgba(168,85,247,0.4)] dark:shadow-[0_0_12px_rgba(168,85,247,0.3)]"
    }
};

const SIZE_CLASSES = {
    sm: "px-2 py-0.5 text-[10px] gap-1",
    md: "px-2.5 py-1 text-[11px] gap-1.5",
    lg: "px-3.5 py-1.5 text-xs gap-2",
};

export function PlanBadge({ planId, className, showIcon = true, size = 'md' }: PlanBadgeProps) {
    if (!planId) {
        return (
            <div className={cn(
                "inline-flex items-center rounded-full font-bold uppercase tracking-wider bg-gray-100 text-gray-500 border border-gray-200",
                SIZE_CLASSES[size],
                className
            )}>
                {showIcon && <span>⚪</span>}
                Free
            </div>
        );
    }

    const config = PLAN_CONFIG[planId.toLowerCase()] || PLAN_CONFIG.starter;
    const isElite = planId.toLowerCase() === 'elite';

    return (
        <div className={cn(
            "inline-flex items-center rounded-full font-bold uppercase tracking-wider border shadow-sm",
            config.color,
            config.border,
            config.glow,
            isElite && "animate-pulse-subtle",
            SIZE_CLASSES[size],
            className
        )}>
            {showIcon && <span>{config.icon}</span>}
            {config.label}
            {/* Elite shimmer effect */}
            {isElite && (
                <style dangerouslySetInnerHTML={{ __html: `
                    @keyframes pulse-subtle {
                        0%, 100% { opacity: 1; }
                        50% { opacity: 0.85; }
                    }
                    .animate-pulse-subtle {
                        animation: pulse-subtle 2s ease-in-out infinite;
                    }
                `}} />
            )}
        </div>
    );
}
