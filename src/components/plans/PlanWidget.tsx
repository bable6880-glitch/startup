'use client';

import React from 'react';
import Link from 'next/link';
import { usePlanAccess, SubscriptionData } from '@/hooks/use-plan-access';
import { cn } from '@/lib/utils';
import { PlanBadge } from '@/components/plans/PlanBadge';
import { LimitWarningModal } from '@/components/plans/LimitWarningModal';

export function PlanWidget() {
    const { data, loading, error } = usePlanAccess();

    if (loading) {
        return (
            <div className="animate-pulse rounded-2xl border border-gray-100 p-5 space-y-4 bg-white">
                <div className="h-4 bg-gray-100 rounded w-1/3" />
                <div className="space-y-2">
                    <div className="h-3 bg-gray-100 rounded w-full" />
                    <div className="h-2 bg-gray-100 rounded w-4/5" />
                </div>
            </div>
        );
    }

    if (error || !data) {
        return null; // Don't show widget if failed to load
    }

    return (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 space-y-4">
            
            {/* Header row */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-600">Your Plan</span>
                    <PlanBadge planId={data.planId} size="sm" showIcon={true} />
                </div>
                <div className="flex items-center gap-3">
                    {!data.isFree && (
                        <Link href="/dashboard/subscription/manage" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                            Manage
                        </Link>
                    )}
                    {data.canUpgrade && (
                        <Link href="/dashboard/subscription" className="text-xs text-orange-500 hover:text-orange-600 font-medium">
                            Upgrade →
                        </Link>
                    )}
                </div>
            </div>
            
            {/* Usage bars — only show if has plan */}
            {!data.isFree && (
                <div className="space-y-3">
                    
                    {/* Orders usage */}
                    {data.usage.ordersLimit !== null && (
                        <UsageBar
                            label="Orders this month"
                            used={data.usage.ordersUsed}
                            limit={data.usage.ordersLimit}
                            percent={data.usage.ordersPercent ?? 0}
                        />
                    )}
                    
                    {/* Menu items usage */}
                    {data.usage.menuItemsLimit !== null && (
                        <UsageBar
                            label="Menu items"
                            used={data.usage.menuItemsUsed}
                            limit={data.usage.menuItemsLimit}
                            percent={data.usage.menuItemsPercent ?? 0}
                        />
                    )}
                    
                    {/* Potluck uses */}
                    {data.usage.potluckLimit !== -1 && (
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">🫕 Group Deals remaining</span>
                            <span className={cn(
                                'font-medium',
                                (data.usage.potluckRemaining ?? 0) === 0 ? 'text-red-500' : 'text-gray-700'
                            )}>
                                {data.usage.potluckRemaining ?? 0} left
                            </span>
                        </div>
                    )}
                    
                    {/* Renewal info */}
                    <div className="pt-1 text-xs text-gray-400">
                        {data.subscription?.cancelAtPeriodEnd
                            ? `Cancels on ${formatDate(data.subscription.currentPeriodEnd)}`
                            : `Renews on ${formatDate(data.subscription?.currentPeriodEnd)}`
                        }
                    </div>
                </div>
            )}
            
            {/* Free tier CTA */}
            {data.isFree && (
                <div className="bg-orange-50 rounded-xl p-4 text-center">
                    <p className="text-sm text-gray-700 mb-2">
                        Unlock more orders, menu items & features
                    </p>
                    <Link href="/dashboard/subscription" className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white text-xs font-medium rounded-lg hover:bg-orange-600 transition-colors">
                        View Plans →
                    </Link>
                </div>
            )}
            
            {/* UPGRADE NUDGE */}
            {shouldShowNudge(data) && (
                <div className="flex items-start gap-3 bg-amber-50 rounded-xl p-3 border border-amber-100">
                    <span className="text-amber-500 text-base flex-shrink-0">⚠️</span>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-amber-800">
                            Approaching your plan limit
                        </p>
                        <p className="text-xs text-amber-600 mt-0.5">
                            {getNudgeMessage(data)}
                        </p>
                        <Link href="/dashboard/subscription" className="text-xs font-medium text-orange-600 hover:underline mt-1 inline-block">
                            Upgrade now →
                        </Link>
                    </div>
                </div>
            )}

            {/* LIMIT WARNING MODAL (90%+ usage) */}
            {!data.isFree && (data.usage.ordersPercent ?? 0) >= 90 && data.usage.ordersLimit !== null && data.subscription && (
                <LimitWarningModal
                    kitchenId={(data.subscription as any).kitchenId || ''}
                    used={data.usage.ordersUsed}
                    limit={data.usage.ordersLimit}
                    remaining={data.usage.ordersRemaining ?? 0}
                />
            )}
        </div>
    );
}

// INLINE HELPER COMPONENTS

function UsageBar({ label, used, limit, percent }: { label: string, used: number, limit: number, percent: number }) {
    const isWarning = percent >= 80;
    const isDanger = percent >= 95;
    
    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">{label}</span>
                <span className={cn(
                    'font-medium',
                    isDanger ? 'text-red-500' :
                    isWarning ? 'text-amber-500' :
                    'text-gray-700'
                )}>
                    {used}/{limit}
                </span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                    className={cn(
                        'h-full rounded-full transition-all duration-500',
                        isDanger ? 'bg-red-400' :
                        isWarning ? 'bg-amber-400' :
                        'bg-orange-400'
                    )}
                    style={{ width: `${Math.min(100, percent)}%` }}
                />
            </div>
        </div>
    );
}

function shouldShowNudge(data: SubscriptionData): boolean {
    if (data.isFree) return false;
    return (
        (data.usage.ordersPercent ?? 0) >= 80 ||
        (data.usage.menuItemsPercent ?? 0) >= 80 ||
        (data.usage.potluckRemaining === 0 && data.usage.potluckLimit > 0)
    );
}

function getNudgeMessage(data: SubscriptionData): string {
    if ((data.usage.ordersPercent ?? 0) >= 80) {
        const rem = data.usage.ordersRemaining ?? 0;
        return `Only ${rem} order${rem === 1 ? '' : 's'} remaining this month`;
    }
    if ((data.usage.menuItemsPercent ?? 0) >= 80) {
        const lim = data.usage.menuItemsLimit;
        return `Approaching your ${lim} item menu limit`;
    }
    if (data.usage.potluckRemaining === 0 && data.usage.potluckLimit > 0) {
        return 'No Group Deal uses remaining this period';
    }
    return 'Upgrade for more capacity';
}

function formatDate(dateValue: string | Date | undefined | null): string {
    if (!dateValue) return 'Unknown';
    return new Date(dateValue).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}
