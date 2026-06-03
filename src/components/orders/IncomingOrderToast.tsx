"use client";

import React, { useState, useEffect } from "react";
import { useIncomingOrders, type PendingOrder } from "@/contexts/IncomingOrderContext";
import { getErrorMessage } from "@/lib/utils/error-handler";

interface IncomingOrderToastProps {
    order: PendingOrder;
}

export function IncomingOrderToast({ order }: IncomingOrderToastProps) {
    const { acceptOrder, rejectOrder, dismissOrder } = useIncomingOrders();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [rejectMode, setRejectMode] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Auto-dismiss after 8 seconds if not interacting
    useEffect(() => {
        if (rejectMode || isSubmitting) return;
        const timer = setTimeout(() => dismissOrder(order.id), 8000);
        return () => clearTimeout(timer);
    }, [order.id, dismissOrder, rejectMode, isSubmitting]);

    const handleAccept = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        setErrorMsg(null);
        try {
            await acceptOrder(order.id);
        } catch (err) {
            setErrorMsg(getErrorMessage(err));
            setIsSubmitting(false);
        }
    };

    const handleReject = async () => {
        if (!rejectMode) {
            setRejectMode(true);
            return;
        }
        if (isSubmitting) return;
        setIsSubmitting(true);
        setErrorMsg(null);
        try {
            await rejectOrder(order.id, rejectReason);
        } catch (err) {
            setErrorMsg(getErrorMessage(err));
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-80 sm:w-96 bg-neutral-900/95 backdrop-blur-md rounded-2xl shadow-2xl border-l-4 border-l-orange-500 border-y border-r border-neutral-800 overflow-hidden animate-slide-in-right">
            <div className="p-4">
                <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2 text-white">
                        <span className="text-xl animate-bell-swing origin-top">🔔</span>
                        <span className="font-semibold text-sm">New Order</span>
                    </div>
                    {!rejectMode && !isSubmitting && (
                        <div className="relative w-6 h-6 flex items-center justify-center">
                            <svg className="absolute inset-0 w-full h-full -rotate-90">
                                <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.1)" strokeWidth="2" fill="none" />
                                <circle 
                                    cx="12" cy="12" r="10" 
                                    stroke="#f97316" strokeWidth="2" fill="none"
                                    strokeDasharray="62.8"
                                    className="animate-[stroke-dashoffset_8s_linear_forwards]"
                                    style={{ strokeDashoffset: "62.8" }}
                                />
                            </svg>
                            <button onClick={() => dismissOrder(order.id)} className="text-neutral-400 hover:text-white z-10 text-xs">✕</button>
                        </div>
                    )}
                </div>

                <div className="text-sm text-neutral-300 mb-4">
                    <p className="font-medium text-white">{order.customerName} · {order.itemCount} item{order.itemCount > 1 ? "s" : ""}</p>
                    <p className="text-orange-400 font-semibold mt-0.5">PKR {order.totalAmount.toLocaleString()}</p>
                </div>

                {errorMsg && (
                    <div className="mb-3 text-xs text-red-400 bg-red-950/30 p-2 rounded">
                        {errorMsg}
                    </div>
                )}

                {rejectMode ? (
                    <div className="space-y-3 animate-fade-in-up">
                        <input 
                            type="text"
                            placeholder="Reason (optional)"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500"
                        />
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setRejectMode(false)}
                                disabled={isSubmitting}
                                className="flex-1 px-3 py-2 text-xs text-neutral-400 hover:text-white transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleReject}
                                disabled={isSubmitting}
                                className="flex-1 px-3 py-2 text-xs font-medium bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50 flex items-center justify-center"
                            >
                                {isSubmitting ? "Rejecting..." : "Confirm Reject"}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex gap-2">
                        <button 
                            onClick={handleAccept}
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-500 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 min-h-[44px]"
                        >
                            {isSubmitting ? "Accepting..." : <><span className="text-lg leading-none">✓</span> Accept</>}
                        </button>
                        <button 
                            onClick={handleReject}
                            disabled={isSubmitting}
                            className="px-4 py-2.5 text-neutral-400 hover:text-red-400 text-sm font-medium transition-colors disabled:opacity-50 min-h-[44px]"
                        >
                            Reject
                        </button>
                    </div>
                )}
            </div>
            {/* Inject dynamic styles since tailwind arbitrary values can be tricky for stroke-dashoffset animation */}
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes stroke-dashoffset {
                    to { stroke-dashoffset: 0; }
                }
            `}} />
        </div>
    );
}
