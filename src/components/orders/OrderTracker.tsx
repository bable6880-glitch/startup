"use client";

import { useState, useCallback } from "react";
import { useCustomerSSE } from "@/hooks/use-customer-sse";
import { CountdownTimer } from "./CountdownTimer";
import WriteKitchenReviewAction from "../reviews/WriteKitchenReviewAction";
import confetti from "canvas-confetti";

type OrderStatus = "PENDING" | "ACCEPTED" | "COMPLETED" | "CANCELLED";

interface OrderTrackerProps {
    customerId: string;
    initialOrder: {
        id: string;
        status: OrderStatus | string;
        estimatedMinutes: number | null;
        acceptedAt: string | null;
        kitchen: {
            id: string;
            name: string;
        }
    };
}

const STATUS_STAGES = ["PENDING", "ACCEPTED", "COMPLETED"];

export function OrderTracker({ customerId, initialOrder }: OrderTrackerProps) {
    const [status, setStatus] = useState<OrderStatus>(initialOrder.status as OrderStatus);
    const [eta, setEta] = useState<number | null>(initialOrder.estimatedMinutes);
    const [acceptedAt, setAcceptedAt] = useState<string | null>(initialOrder.acceptedAt);

    const handleStatusChange = useCallback((payload: any) => {
        if (payload.orderId === initialOrder.id) {
            setStatus((prev) => {
                if (prev === "PENDING" && payload.newStatus === "ACCEPTED") {
                    confetti({
                        particleCount: 100,
                        spread: 70,
                        origin: { y: 0.6 }
                    });
                }
                return payload.newStatus as OrderStatus;
            });
            if (payload.estimatedMinutes) setEta(payload.estimatedMinutes);
            if (payload.acceptedAt) setAcceptedAt(payload.acceptedAt);
        }
    }, [initialOrder.id]);

    const { connected } = useCustomerSSE({ customerId, onStatusChange: handleStatusChange });

    // Cancelled State
    if (status === "CANCELLED") {
        return (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:bg-red-900/10 dark:border-red-900/50 animate-scale-in">
                <span className="text-4xl mb-4 block">❌</span>
                <h3 className="text-xl font-bold text-red-700 dark:text-red-400">Order was declined by the kitchen.</h3>
                <p className="mt-2 text-sm text-red-600/80 dark:text-red-400/80">Your payment method has not been charged.</p>
            </div>
        );
    }

    const currentStageIndex = STATUS_STAGES.indexOf(status);

    return (
        <div className="space-y-6">
            {/* Live Status indicator */}
            <div className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm border border-neutral-100 dark:bg-neutral-800 dark:border-neutral-700 animate-fade-in-down">
                <div className="flex items-center gap-3">
                    <div className={`relative flex h-3 w-3 ${connected && status !== 'COMPLETED' ? 'animate-glow-pulse' : ''}`}>
                        {connected && status !== "COMPLETED" && (
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                        )}
                        <span className={`relative inline-flex h-3 w-3 rounded-full ${connected ? 'bg-green-500' : 'bg-neutral-400'}`}></span>
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                        {connected ? (status === "COMPLETED" ? "Order Finalized" : "Live Tracking Active") : "Reconnecting..."}
                    </span>
                </div>
            </div>

            {/* Timeline Tree */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 dark:bg-neutral-800 dark:border-neutral-700 animate-fade-in-up">
                <div className="relative">
                    {/* Background line */}
                    <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-neutral-100 dark:bg-neutral-700"></div>
                    
                    {/* Progress line */}
                    <div 
                        className="absolute left-6 top-6 w-0.5 bg-primary-500 transition-all duration-1000"
                        style={{ height: `${currentStageIndex * 50}%` }}
                    ></div>

                    {/* Nodes */}
                    <div className="space-y-12 relative">
                        {/* 1. Pending */}
                        <div className={`flex gap-6 ${currentStageIndex >= 0 ? "opacity-100" : "opacity-40"}`}>
                            <div className={`relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-4 border-white transition-colors duration-500 dark:border-neutral-800 ${currentStageIndex >= 0 ? "bg-primary-500 text-white" : "bg-neutral-200 text-neutral-400 dark:bg-neutral-700"}`}>
                                📝
                            </div>
                            <div className="pt-2">
                                <h4 className="text-lg font-bold text-neutral-900 dark:text-white">Placed</h4>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400">Waiting for kitchen to accept.</p>
                            </div>
                        </div>

                        {/* 2. Accepted / Preparing */}
                        <div className={`flex gap-6 ${currentStageIndex >= 1 ? "opacity-100" : "opacity-40"}`}>
                            <div className={`relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-4 border-white transition-colors duration-500 dark:border-neutral-800 ${currentStageIndex >= 1 ? "bg-primary-500 text-white" : "bg-neutral-200 text-neutral-400 dark:bg-neutral-700"}`}>
                                👨‍🍳
                            </div>
                            <div className="pt-2 w-full">
                                <h4 className="text-lg font-bold text-neutral-900 dark:text-white">Accepted by Kitchen</h4>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">Kitchen has accepted your order.</p>

                                {/* Live Countdown Inject */}
                                {status === "ACCEPTED" && eta && acceptedAt && (
                                    <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 dark:bg-blue-900/10 dark:border-blue-900/30">
                                        <CountdownTimer acceptedAt={acceptedAt} estimatedMinutes={eta} />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 3. Completed */}
                        <div className={`flex gap-6 ${currentStageIndex >= 2 ? "opacity-100" : "opacity-40"}`}>
                            <div className={`relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-4 border-white transition-colors duration-500 dark:border-neutral-800 ${currentStageIndex >= 2 ? "bg-green-500 text-white" : "bg-neutral-200 text-neutral-400 dark:bg-neutral-700"}`}>
                                🎉
                            </div>
                            <div className="pt-2 w-full">
                                <h4 className="text-lg font-bold text-neutral-900 dark:text-white">Out for Delivery / Ready for Pickup</h4>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400">Hope you enjoy your meal!</p>
                                
                                {/* Auto Review Trigger integration */}
                                {status === "COMPLETED" && (
                                    <div className="mt-6 rounded-xl border border-neutral-100 bg-neutral-50 p-5 dark:bg-neutral-900/50 dark:border-neutral-800/50 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                        <h5 className="font-bold text-sm uppercase tracking-wide text-primary-600 dark:text-primary-400 mb-2">Rate Your Experience</h5>
                                        <WriteKitchenReviewAction kitchenId={initialOrder.kitchen.id} kitchenName={initialOrder.kitchen.name} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
