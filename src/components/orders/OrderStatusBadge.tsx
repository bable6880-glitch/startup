import { cn } from "@/lib/utils";

export type OrderStatus = 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'CANCELLED';

interface OrderStatusBadgeProps {
    status: OrderStatus;
    className?: string;
}

export function OrderStatusBadge({ status, className }: OrderStatusBadgeProps) {
    const config = {
        PENDING: {
            bg: "bg-amber-100 dark:bg-amber-500/20",
            text: "text-amber-700 dark:text-amber-400",
            border: "border-amber-200 dark:border-amber-500/30",
            label: "Pending — waiting for cook",
            dot: "bg-amber-500",
            animate: "animate-status-pulse",
        },
        ACCEPTED: {
            bg: "bg-blue-100 dark:bg-blue-500/20",
            text: "text-blue-700 dark:text-blue-400",
            border: "border-blue-200 dark:border-blue-500/30",
            label: "Accepted — preparing",
            dot: "bg-blue-500",
            animate: "",
        },
        COMPLETED: {
            bg: "bg-green-100 dark:bg-green-500/20",
            text: "text-green-700 dark:text-green-400",
            border: "border-green-200 dark:border-green-500/30",
            label: "Completed",
            dot: "bg-green-500",
            animate: "",
        },
        CANCELLED: {
            bg: "bg-red-50 dark:bg-red-500/10",
            text: "text-red-500 dark:text-red-400",
            border: "border-red-100 dark:border-red-500/20",
            label: "Cancelled",
            dot: "bg-red-500",
            animate: "",
        },
    };

    const c = config[status] || config.PENDING;

    return (
        <div className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border",
            c.bg, c.text, c.border, className
        )}>
            <div className="relative flex items-center justify-center w-2 h-2">
                {c.animate && (
                    <div className={cn("absolute inset-0 rounded-full opacity-50", c.dot, c.animate)} />
                )}
                <div className={cn("w-1.5 h-1.5 rounded-full relative z-10", c.dot)} />
            </div>
            {c.label}
        </div>
    );
}
