'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/firebase/auth-context';

// ─── Types ──────────────────────────────────────────────────────────────────

export type PlanId = 'starter' | 'growth' | 'pro' | 'elite';

const PLAN_HIERARCHY: PlanId[] = ['starter', 'growth', 'pro', 'elite'];

/**
 * Check if a planId is at least as high as a minimum tier.
 * Example: isPlanAtLeast('pro', 'growth') → true
 */
export function isPlanAtLeast(current: PlanId | string | null, minimum: PlanId): boolean {
    if (!current) return false;
    const currentIdx = PLAN_HIERARCHY.indexOf(current as PlanId);
    const minimumIdx = PLAN_HIERARCHY.indexOf(minimum);
    if (currentIdx === -1 || minimumIdx === -1) return false;
    return currentIdx >= minimumIdx;
}

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
    // Kitchen lock status (returned by /api/seller/subscription)
    isKitchenLocked?: boolean;
    lockReason?: string | null;
}

// ─── Cross-Tab Sync Constants ───────────────────────────────────────────────

const PLAN_UPDATED_KEY = 'st:plan_updated';

// ─── Hook ───────────────────────────────────────────────────────────────────

export function usePlanAccess() {
    const { user, getIdToken } = useAuth();
    const [data, setData] = useState<SubscriptionData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPlan = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const token = await getIdToken();
            const res = await fetch('/api/seller/subscription', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const d = await res.json();
            
            if (d.success) {
                const enrichedData = {
                    ...d,
                    planId: (d.subscription?.planId ?? null) as PlanId | null
                };
                setData(enrichedData);
            } else {
                setError(d.error?.message ?? d.error ?? 'Failed to load plan access');
            }
        } catch (err) {
            setError('Network error');
        } finally {
            setLoading(false);
        }
    }, [user, getIdToken]);

    useEffect(() => {
        if (user) {
            fetchPlan();
        } else {
            setLoading(false);
        }
    }, [user, fetchPlan]);

    // ── Phase 5: Cross-Tab Synchronization ─────────────────────────────
    // When a purchase completes in another tab and writes to localStorage,
    // this listener fires a refetch so all tabs reflect the new plan instantly.
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === PLAN_UPDATED_KEY && e.newValue && user) {
                fetchPlan();
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [user, fetchPlan]);

    return { data, loading, error, refetch: fetchPlan };
}

/**
 * Call this from success/purchase pages to notify all other open tabs
 * that the plan was updated. Triggers a background refetch in each tab.
 */
export function broadcastPlanUpdate() {
    if (typeof window === 'undefined') return;
    localStorage.setItem(PLAN_UPDATED_KEY, Date.now().toString());
}

// ─── Styling Helpers ────────────────────────────────────────────────────────

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
