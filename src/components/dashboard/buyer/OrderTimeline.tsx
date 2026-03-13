import React from "react";

type OrderStatus = "PENDING" | "ACCEPTED" | "PREPARING" | "READY" | "COMPLETED" | "CANCELLED";

interface OrderTimelineProps {
    status: OrderStatus;
    placedAt?: string | null;
    acceptedAt?: string | null;
    completedAt?: string | null;
    cancelledAt?: string | null;
}

const steps = [
    { id: "PENDING", label: "Order Placed", desc: "Waiting for kitchen to accept" },
    { id: "ACCEPTED", label: "Accepted", desc: "Kitchen accepted your order" },
    { id: "PREPARING", label: "Preparing", desc: "Your meal is being prepared" },
    { id: "READY", label: "Ready", desc: "Waiting for pickup/delivery" },
    { id: "COMPLETED", label: "Completed", desc: "Order fulfilled successfully" },
];

export function OrderTimeline({ status, placedAt, acceptedAt, completedAt, cancelledAt }: OrderTimelineProps) {
    if (status === "CANCELLED") {
        return (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-900/30 dark:bg-red-900/10 dark:text-red-400">
                <div className="flex items-center gap-3">
                    <span className="text-xl">❌</span>
                    <div>
                        <h4 className="font-semibold text-sm">Order Cancelled</h4>
                        <p className="text-xs text-red-600 dark:text-red-400/80 mt-0.5">
                            {cancelledAt ? new Date(cancelledAt).toLocaleString("en-PK") : "This order was cancelled."}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Determine current step index
    const statusIndex = steps.findIndex(s => s.id === status);
    
    // Fallback if status not in standard flow
    const currentStep = statusIndex >= 0 ? statusIndex : 0;

    const getTimeForStep = (stepId: string) => {
        if (stepId === "PENDING") return placedAt;
        if (stepId === "ACCEPTED") return acceptedAt;
        if (stepId === "COMPLETED") return completedAt;
        return null;
    };

    return (
        <div className="py-6">
            <div className="relative border-l-2 border-neutral-100 dark:border-neutral-800 ml-3 md:ml-0 md:border-l-0 md:border-t-2 md:flex md:items-start md:justify-between space-y-8 md:space-y-0 text-sm">
                
                {/* Mobile vertical line is handled by the wrapper border-l. 
                    Desktop horizontal line is handled by wrapper border-t. 
                    We need an active line overlay for desktop. */}
                <div 
                    className="hidden md:block absolute top-0 left-0 h-0.5 bg-primary-500 transition-all duration-500" 
                    style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                />

                {steps.map((step, index) => {
                    const isCompleted = index <= currentStep;
                    const isActive = index === currentStep;
                    const time = getTimeForStep(step.id);

                    return (
                        <div key={step.id} className="relative flex-1 md:text-center md:pt-6 group">
                            {/* Step Indicator Dot (Desktop uses absolute positioning over the line) */}
                            <div className="absolute -left-[35px] top-1 md:-top-3 md:left-1/2 md:-translate-x-1/2">
                                <div className={`flex h-6 w-6 items-center justify-center rounded-full border-2 bg-white dark:bg-neutral-900 transition-colors duration-300 ${
                                    isCompleted 
                                        ? "border-primary-500 text-primary-500" 
                                        : "border-neutral-200 text-neutral-300 dark:border-neutral-700"
                                }`}>
                                    {isCompleted ? (
                                        <svg className="w-3 h-3 text-current" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    ) : (
                                        <span className="h-2 w-2 rounded-full bg-current opacity-30" />
                                    )}
                                </div>
                            </div>

                            {/* Step Content */}
                            <div>
                                <h4 className={`font-semibold transition-colors ${
                                    isActive ? "text-primary-700 dark:text-primary-400" :
                                    isCompleted ? "text-neutral-900 dark:text-white" : "text-neutral-400 dark:text-neutral-600"
                                }`}>
                                    {step.label}
                                </h4>
                                <p className={`text-xs mt-1 max-w-[140px] md:mx-auto ${
                                    isActive ? "text-primary-600/80 dark:text-primary-300/80" : "text-neutral-500 dark:text-neutral-500"
                                }`}>
                                    {time ? new Date(time).toLocaleTimeString("en-PK", { hour: "numeric", minute: "2-digit" }) : step.desc}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
