'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePlanAccess } from '@/hooks/use-plan-access';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/firebase/auth-context';

const PLAN_COLORS: Record<string, string> = {
    starter: 'from-gray-500 to-gray-600',
    growth: 'from-orange-500 to-amber-500',
    pro: 'from-blue-500 to-blue-700',
    elite: 'from-purple-600 to-purple-900',
};

const PLAN_ICONS: Record<string, string> = {
    starter: '🌱',
    growth: '📈',
    pro: '⚡',
    elite: '👑',
};

export default function ManageSubscriptionPage() {
    const { data, loading, error } = usePlanAccess();
    const { getIdToken } = useAuth();
    const [cancelling, setCancelling] = useState(false);
    const [cancelConfirm, setCancelConfirm] = useState(false);
    const [cancelDone, setCancelDone] = useState(false);
    const [cancelError, setCancelError] = useState<string | null>(null);

    const handleCancel = async () => {
        if (!cancelConfirm) {
            setCancelConfirm(true);
            return;
        }
        setCancelling(true);
        setCancelError(null);
        try {
            const token = await getIdToken();
            const res = await fetch('/api/seller/subscription', {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            const body = await res.json();
            if (res.ok && body.success) {
                setCancelDone(true);
                setCancelConfirm(false);
            } else {
                setCancelError(body.error || 'Cancellation failed');
            }
        } catch {
            setCancelError('Network error. Please try again.');
        } finally {
            setCancelling(false);
        }
    };

    if (loading) {
        return (
            <div className="mx-auto max-w-2xl px-4 py-12">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 w-40 bg-gray-100 rounded" />
                    <div className="h-48 bg-gray-100 rounded-2xl" />
                    <div className="h-32 bg-gray-100 rounded-2xl" />
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="mx-auto max-w-2xl px-4 py-12 text-center">
                <p className="text-red-500">{error || 'Failed to load subscription data.'}</p>
                <Link href="/dashboard" className="mt-4 inline-block text-sm text-orange-500 hover:underline">
                    ← Back to Dashboard
                </Link>
            </div>
        );
    }

    const planId = data.planId ?? 'free';
    const gradientClass = PLAN_COLORS[planId] ?? 'from-gray-400 to-gray-600';
    const planIcon = PLAN_ICONS[planId] ?? '📦';
    const renewalDate = data.subscription?.currentPeriodEnd
        ? new Date(data.subscription.currentPeriodEnd).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : null;

    return (
        <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
            <div className="flex items-center gap-3 mb-2">
                <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                    ← Dashboard
                </Link>
                <span className="text-gray-300">/</span>
                <Link href="/dashboard/subscription" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                    Plans
                </Link>
                <span className="text-gray-300">/</span>
                <span className="text-sm text-gray-900 font-medium">Manage</span>
            </div>

            <h1 className="text-2xl font-bold text-gray-900">Manage Subscription</h1>

            {/* Current Plan Card */}
            <div className={cn('rounded-2xl bg-gradient-to-br p-6 text-white', gradientClass)}>
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-2xl">{planIcon}</span>
                            <span className="text-xs font-semibold uppercase tracking-widest opacity-80">Current Plan</span>
                        </div>
                        <h2 className="text-3xl font-extrabold">{data.planConfig?.displayName ?? 'Free'}</h2>
                        {data.planConfig?.priceRs && (
                            <p className="mt-1 text-white/70 text-sm">
                                Rs.{data.planConfig.priceRs} / {data.planConfig.billingPeriodMonths === 1 ? 'month' : `${data.planConfig.billingPeriodMonths} months`}
                            </p>
                        )}
                    </div>
                    {data.subscription?.status && (
                        <span className={cn(
                            'px-3 py-1 rounded-full text-xs font-bold uppercase',
                            data.subscription.cancelAtPeriodEnd
                                ? 'bg-red-500/20 text-red-100'
                                : 'bg-white/20 text-white'
                        )}>
                            {data.subscription.cancelAtPeriodEnd ? 'Cancels' : data.subscription.status}
                        </span>
                    )}
                </div>

                {renewalDate && (
                    <div className="mt-4 pt-4 border-t border-white/20 text-sm text-white/80">
                        {data.subscription?.cancelAtPeriodEnd
                            ? `⚠️ Access ends on ${renewalDate}`
                            : `🔄 Renews on ${renewalDate}`}
                    </div>
                )}
            </div>

            {/* Usage Section */}
            {!data.isFree && (
                <div className="rounded-2xl border border-gray-100 bg-white p-6 space-y-5">
                    <h3 className="font-semibold text-gray-900">Usage This Period</h3>

                    {data.usage.ordersLimit !== null && (
                        <UsageRow
                            label="Monthly Orders"
                            used={data.usage.ordersUsed}
                            limit={data.usage.ordersLimit}
                            percent={data.usage.ordersPercent ?? 0}
                        />
                    )}
                    {data.usage.menuItemsLimit !== null && (
                        <UsageRow
                            label="Menu Items"
                            used={data.usage.menuItemsUsed}
                            limit={data.usage.menuItemsLimit}
                            percent={data.usage.menuItemsPercent ?? 0}
                        />
                    )}
                    {data.usage.potluckLimit > 0 && (
                        <UsageRow
                            label="Group Deals (Potluck)"
                            used={data.usage.potluckLimit - data.usage.potluckRemaining}
                            limit={data.usage.potluckLimit}
                            percent={((data.usage.potluckLimit - data.usage.potluckRemaining) / data.usage.potluckLimit) * 100}
                        />
                    )}
                </div>
            )}

            {/* Actions */}
            <div className="rounded-2xl border border-gray-100 bg-white p-6 space-y-4">
                <h3 className="font-semibold text-gray-900">Actions</h3>

                {data.canUpgrade && (
                    <Link
                        href="/dashboard/subscription"
                        className="flex items-center justify-between w-full px-5 py-3.5 rounded-xl bg-orange-500 text-white font-medium hover:bg-orange-600 transition-colors"
                    >
                        <span>Upgrade Plan</span>
                        <span>→</span>
                    </Link>
                )}

                {cancelDone ? (
                    <div className="rounded-xl bg-amber-50 border border-amber-100 p-4 text-sm text-amber-800">
                        ✅ Subscription cancelled. You will retain access until {renewalDate}.
                    </div>
                ) : data.canCancel && !data.subscription?.cancelAtPeriodEnd ? (
                    <div className="space-y-3">
                        {cancelConfirm && (
                            <div className="rounded-xl bg-red-50 border border-red-100 p-4 text-sm text-red-800">
                                <strong>Are you sure?</strong> You will retain access until {renewalDate}, then your account reverts to the free tier.
                                {cancelError && <p className="mt-2 text-red-600">{cancelError}</p>}
                            </div>
                        )}
                        <button
                            onClick={handleCancel}
                            disabled={cancelling}
                            className={cn(
                                'w-full px-5 py-3 rounded-xl text-sm font-medium transition-colors border',
                                cancelConfirm
                                    ? 'bg-red-500 text-white border-red-500 hover:bg-red-600'
                                    : 'bg-white text-red-500 border-red-200 hover:bg-red-50'
                            )}
                        >
                            {cancelling ? 'Cancelling...' : cancelConfirm ? 'Yes, Cancel My Subscription' : 'Cancel Subscription'}
                        </button>
                        {cancelConfirm && (
                            <button
                                onClick={() => setCancelConfirm(false)}
                                className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
                            >
                                Keep my subscription
                            </button>
                        )}
                    </div>
                ) : data.subscription?.cancelAtPeriodEnd ? (
                    <div className="rounded-xl bg-amber-50 border border-amber-100 p-4 text-sm text-amber-800">
                        ⚠️ Your subscription is set to cancel on {renewalDate}. Contact support to reactivate.
                    </div>
                ) : null}

                {data.isFree && (
                    <div className="text-sm text-gray-500 text-center py-2">
                        You are on the free tier.{' '}
                        <Link href="/dashboard/subscription" className="text-orange-500 hover:underline font-medium">
                            View paid plans →
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

function UsageRow({ label, used, limit, percent }: { label: string, used: number, limit: number, percent: number }) {
    const isDanger = percent >= 95;
    const isWarning = percent >= 80;
    return (
        <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
                <span className="text-gray-600">{label}</span>
                <span className={cn(
                    'font-medium',
                    isDanger ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-gray-700'
                )}>
                    {used} / {limit}
                </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                    className={cn(
                        'h-full rounded-full transition-all',
                        isDanger ? 'bg-red-400' : isWarning ? 'bg-amber-400' : 'bg-orange-400'
                    )}
                    style={{ width: `${Math.min(100, percent)}%` }}
                />
            </div>
        </div>
    );
}
