'use client';

import { useState, useEffect } from 'react';

// You might want to import PlanId from your types, but we'll define locally for completeness.
export type PlanId = 'starter' | 'growth' | 'pro' | 'elite';

export interface SubscriptionData {
    subscription: {
        id: string;
        planId: string;
        status: string;
        currentPeriodStart: string | Date;
        currentPeriodEnd: string | Date;
        cancelAtPeriodEnd: boolean;
        cancelledAt: string | Date | null;
    } | null;
    planConfig: {
        displayName: string;
        priceRs: number;
        billingPeriodMonths: number;
        menuItemLimit: number | null;
        monthlyOrderLimit: number | null;
        potluckUsesPerPeriod: number;
    } | null;
    usage: {
        ordersUsed: number;
        ordersLimit: number | null;
        ordersRemaining: number | null;
        ordersPercent: number | null;
        menuItemsUsed: number;
        menuItemsLimit: number | null;
        menuItemsPercent: number | null;
        potluckRemaining: number;
        potluckLimit: number;
    };
    isFree: boolean;
    isActive: boolean;
    canUpgrade: boolean;
    canCancel: boolean;
    planId: PlanId | null; // Synthesized locally for convenience in components
}

export function usePlanAccess() {
    const [data, setData] = useState<SubscriptionData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/seller/subscription')
            .then(r => r.json())
            .then(d => {
                if (d.success) {
                    // Extract planId locally for easy checking
                    const enrichedData = {
                        ...d,
                        planId: (d.subscription?.planId ?? null) as PlanId | null
                    };
                    setData(enrichedData);
                } else {
                    setError(d.error?.message ?? d.error ?? 'Failed to load plan access');
                }
            })
            .catch(() => setError('Network error'))
            .finally(() => setLoading(false));
    }, []);

    return { data, loading, error };
}

export function getPlanColor(planId: string | null): string {
    const colors: Record<string, string> = {
        starter: 'bg-gray-100 text-gray-700',
        growth: 'bg-orange-100 text-orange-700',
        pro: 'bg-blue-100 text-blue-700',
        elite: 'bg-purple-100 text-purple-700',
    };
    return colors[planId ?? ''] ?? 'bg-gray-100 text-gray-500';
}

export function getPlanBadgeColor(planId: string | null): string {
    const colors: Record<string, string> = {
        starter: 'border-gray-200 text-gray-600',
        growth: 'border-orange-200 text-orange-600',
        pro: 'border-blue-200 text-blue-600',
        elite: 'border-purple-200 text-purple-600',
    };
    return colors[planId ?? ''] ?? 'border-gray-200 text-gray-500';
}
