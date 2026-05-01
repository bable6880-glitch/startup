'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface PotluckDeal {
    id: string;
    title: string;
    kitchenId: string;
    kitchenName?: string;
    citySlug: string;
    pricePerPlateRs: number;
    regularPriceRs: number;
    targetOrderCount: number;
    currentOrderCount: number;
    totalPlatesAvailable: number;
    expiresAt: string | Date;
    status: 'ACTIVE' | 'FILLED' | 'EXPIRED' | 'CANCELLED';
}

interface PotluckCardProps {
    deal: PotluckDeal;
    onReserve?: () => void;
    showKitchenName?: boolean;
    hasReserved?: boolean;
    reserving?: boolean;
    isSellerView?: boolean;
}

function useCountdown(expiresAt: string | Date) {
    const [timeLeft, setTimeLeft] = useState('');
    const [isUrgent, setIsUrgent] = useState(false);

    useEffect(() => {
        const update = () => {
            const diff = new Date(expiresAt).getTime() - Date.now();
            if (diff <= 0) {
                setTimeLeft('Expired');
                return;
            }
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setIsUrgent(diff < 1800000); // < 30min
            if (h > 0) {
                setTimeLeft(`${h}h ${m}m`);
            } else {
                setTimeLeft(`${m}m ${s}s`);
            }
        };
        update();
        const t = setInterval(update, 1000);
        return () => clearInterval(t);
    }, [expiresAt]);

    return { timeLeft, isUrgent };
}

export function PotluckCard({ deal, onReserve, showKitchenName, hasReserved, reserving }: PotluckCardProps) {
    const [currentCount, setCurrentCount] = useState(deal.currentOrderCount);
    const [dealStatus, setDealStatus] = useState(deal.status);
    const { timeLeft, isUrgent } = useCountdown(deal.expiresAt);

    // SSE Integration
    useEffect(() => {
        let eventSource: EventSource | null = null;
        try {
            eventSource = new EventSource(`/api/potluck/sse?citySlug=${deal.citySlug}`);
            
            eventSource.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'POTLUCK_UPDATE' && data.dealId === deal.id) {
                    if (typeof data.currentOrderCount === 'number') {
                        setCurrentCount(data.currentOrderCount);
                    }
                    if (data.status) {
                        setDealStatus(data.status);
                    }
                }
            };
        } catch (e) {
            console.error("SSE Connection failed", e);
        }

        return () => {
            if (eventSource) {
                eventSource.close();
            }
        };
    }, [deal.citySlug, deal.id]);

    const fillPercent = Math.min((currentCount / deal.targetOrderCount) * 100, 100);

    return (
        <div className="bg-white rounded-2xl border border-orange-100 overflow-hidden shadow-sm">
            {/* Orange top accent */}
            <div className="h-1 bg-gradient-to-r from-orange-400 to-amber-400" />
            
            <div className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                        <h3 className="font-semibold text-sm text-gray-900 leading-snug">
                            🫕 {deal.title}
                        </h3>
                        {showKitchenName && (
                            <p className="text-xs text-gray-400 mt-0.5">{deal.kitchenName}</p>
                        )}
                    </div>
                    <div className="text-right flex-shrink-0">
                        <div className="text-lg font-bold text-orange-600">
                            Rs.{deal.pricePerPlateRs}
                        </div>
                        <div className="text-xs line-through text-gray-400">
                            Rs.{deal.regularPriceRs}
                        </div>
                    </div>
                </div>

                {dealStatus === 'FILLED' ? (
                    // FILLED STATE (celebration)
                    <div className="py-3 text-center animate-bounce">
                        <span className="text-2xl">🎉</span>
                        <p className="text-sm font-semibold text-green-600 mt-1">Deal Activated!</p>
                    </div>
                ) : (
                    // Progress bar
                    <div className="mb-3">
                        <div className="flex justify-between text-xs mb-1.5">
                            <span className="text-gray-500">
                                {currentCount}/{deal.targetOrderCount} orders to activate
                            </span>
                            <span className={cn(
                                'font-medium',
                                isUrgent ? 'text-red-500 animate-pulse' : 'text-gray-500'
                            )}>
                                ⏰ {timeLeft}
                            </span>
                        </div>
                        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className={cn(
                                    'h-full rounded-full transition-all duration-700 ease-out',
                                    fillPercent >= 100 ? 'bg-green-500' :
                                    fillPercent >= 81 ? 'bg-green-400' :
                                    fillPercent >= 51 ? 'bg-amber-400' :
                                    'bg-orange-400'
                                )}
                                style={{
                                    width: `${Math.min(100, fillPercent)}%`
                                }}
                            />
                        </div>
                        <p className="text-xs text-gray-400 mt-1.5">
                            {currentCount >= deal.targetOrderCount
                                ? '🎉 Target reached! Deal activating...'
                                : `Just ${deal.targetOrderCount - currentCount} more to unlock!`
                            }
                        </p>
                    </div>
                )}

                {/* Reserve button */}
                {dealStatus === 'ACTIVE' && currentCount < deal.totalPlatesAvailable ? (
                    <button
                        onClick={onReserve}
                        disabled={reserving || hasReserved}
                        className={cn(
                            'w-full py-2.5 rounded-xl text-sm font-medium transition-colors',
                            hasReserved
                                ? 'bg-green-50 text-green-600 border border-green-200'
                                : 'bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-60'
                        )}
                    >
                        {hasReserved
                            ? '✓ Reserved'
                            : reserving
                            ? 'Reserving...'
                            : `Reserve — Rs.${deal.pricePerPlateRs}`
                        }
                    </button>
                ) : (
                    <div className="w-full py-2.5 rounded-xl text-sm text-center text-gray-400 bg-gray-50">
                        {dealStatus === 'FILLED'
                            ? '🎉 Deal Activated!'
                            : 'Deal Ended'
                        }
                    </div>
                )}
            </div>
        </div>
    );
}
