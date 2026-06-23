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
            <div className="animate-pulse rounded-2xl border border-[rgba(255,255,255,0.06)] p-6 space-y-5 bg-[#161D31] shadow-xl">
                <div className="h-4 bg-white/5 rounded w-1/3" />
                <div className="space-y-3">
                    <div className="h-3 bg-white/5 rounded w-full" />
                    <div className="h-2 bg-white/5 rounded w-4/5" />
                </div>
            </div>
        );
    }

    if (error || !data) {
        return null; // Don't show widget if failed to load
    }

    return (
        <div className="relative rounded-2xl border border-[rgba(255,255,255,0.08)] bg-gradient-to-b from-[#161D31] to-[#0F1726] p-6 space-y-6 shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all hover:border-[rgba(255,255,255,0.12)]">
            {/* Subtle glow effect */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
            
            {/* Header row */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="text-[13px] font-semibold text-[#82869A] tracking-wider uppercase">Your Plan</span>
                    <PlanBadge planId={data.planId} size="sm" showIcon={true} />
                </div>
                <div className="flex items-center gap-4">
                    {!data.isFree && (
                        <Link href="/dashboard/subscription/manage" className="text-xs font-medium text-[#82869A] hover:text-white transition-colors">
                            Manage
                        </Link>
                    )}
                    {data.canUpgrade && (
                        <Link href="/dashboard/subscription" className="group flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white text-xs font-bold rounded-full transition-all shadow-[0_0_15px_rgba(249,115,22,0.3)] hover:shadow-[0_0_20px_rgba(249,115,22,0.5)]">
                            Upgrade <span className="transition-transform group-hover:translate-x-0.5">→</span>
                        </Link>
                    )}
                </div>
            </div>
            
            {/* Usage bars — only show if has plan */}
            {!data.isFree && (
                <div className="space-y-5">
                    
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
                        <div className="flex items-center justify-between text-[13px] bg-white/[0.02] rounded-lg p-3 border border-white/[0.04]">
                            <span className="text-[#82869A] flex items-center gap-2">
                                <span>🫕</span> Group Deals remaining
                            </span>
                            <span className={cn(
                                'font-bold px-2 py-0.5 rounded-md',
                                (data.usage.potluckRemaining ?? 0) === 0 
                                    ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            )}>
                                {data.usage.potluckRemaining ?? 0} left
                            </span>
                        </div>
                    )}
                    
                    {/* Renewal info */}
                    <div className="flex items-center justify-center pt-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.05] text-[11px] font-medium text-[#82869A]">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                            {data.subscription?.cancelAtPeriodEnd
                                ? `Cancels on ${formatDate(data.subscription.currentPeriodEnd)}`
                                : `Renews on ${formatDate(data.subscription?.currentPeriodEnd)}`
                            }
                        </div>
                    </div>
                </div>
            )}
            
            {/* Free tier CTA */}
            {data.isFree && (
                <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl p-5 border border-indigo-500/20 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 blur-[50px] rounded-full"></div>
                    <p className="text-sm text-indigo-100 font-medium mb-4 relative z-10">
                        Unlock more orders, menu items & premium features
                    </p>
                    <Link href="/dashboard/subscription" className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white text-xs font-bold rounded-full transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] relative z-10">
                        View Premium Plans →
                    </Link>
                </div>
            )}
            
            {/* UPGRADE NUDGE */}
            {shouldShowNudge(data) && (
                <div className="flex items-start gap-3 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl p-4 border border-amber-500/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                        <span className="text-amber-400 text-sm">⚠️</span>
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                        <p className="text-[13px] font-bold text-amber-300">
                            Approaching plan limit
                        </p>
                        <p className="text-xs text-amber-200/70 mt-1 leading-relaxed">
                            {getNudgeMessage(data)}
                        </p>
                        <Link href="/dashboard/subscription" className="group inline-flex items-center gap-1 text-xs font-bold text-orange-400 hover:text-orange-300 mt-2 transition-colors">
                            Upgrade now <span className="transition-transform group-hover:translate-x-0.5">→</span>
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
        <div className="space-y-2 group">
            <div className="flex items-center justify-between text-[13px]">
                <span className="text-[#A5A8B8] font-medium">{label}</span>
                <span className={cn(
                    'font-bold px-2 py-0.5 rounded bg-white/[0.03] border',
                    isDanger ? 'text-red-400 border-red-500/20' :
                    isWarning ? 'text-amber-400 border-amber-500/20' :
                    'text-[#D0D2D6] border-white/5'
                )}>
                    {used} <span className="text-[#676D7D] font-normal">/ {limit}</span>
                </span>
            </div>
            <div className="h-2 bg-[#0F1726] rounded-full overflow-hidden border border-white/[0.02] shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)]">
                <div
                    className={cn(
                        'h-full rounded-full transition-all duration-1000 ease-out relative',
                        isDanger ? 'bg-gradient-to-r from-red-500 to-rose-400' :
                        isWarning ? 'bg-gradient-to-r from-amber-500 to-orange-400' :
                        'bg-gradient-to-r from-[#7367F0] to-[#9E95F5]'
                    )}
                    style={{ width: `${Math.min(100, percent)}%` }}
                >
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-shimmer" style={{ animationDuration: '3s' }}></div>
                </div>
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
