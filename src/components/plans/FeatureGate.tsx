'use client';

import React from 'react';
import Link from 'next/link';

// Use standard PlanId type from existing codebase if available, or define locally.
export type PlanId = 'starter' | 'growth' | 'pro' | 'elite';
export type PlanFeature = string; // Broad type, ideally imports from your schema types

const PLAN_ORDER: PlanId[] = ['starter', 'growth', 'pro', 'elite'];

const PLAN_DISPLAY_NAMES: Record<PlanId, string> = {
    starter: 'Starter',
    growth: 'Growth',
    pro: 'Pro',
    elite: 'Elite',
};

interface FeatureGateProps {
    feature: PlanFeature;
    currentPlanId: PlanId | null;
    requiredPlan: PlanId;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export function FeatureGate({
    currentPlanId,
    requiredPlan,
    children,
    fallback
}: FeatureGateProps) {
    const hasAccess = currentPlanId !== null &&
        PLAN_ORDER.indexOf(currentPlanId) >= PLAN_ORDER.indexOf(requiredPlan);

    if (hasAccess) {
        return <>{children}</>;
    }

    if (fallback) {
        return <>{fallback}</>;
    }

    return (
        <div className="relative rounded-xl overflow-hidden">
            {/* Blurred content behind */}
            <div
                className="pointer-events-none select-none"
                style={{
                    filter: 'blur(4px)',
                    opacity: 0.4,
                }}
                aria-hidden="true"
            >
                {children}
            </div>

            {/* Lock overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 backdrop-blur-sm rounded-xl p-4 text-center">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mb-3">
                    <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>
                <p className="text-sm font-semibold text-gray-800 mb-1">
                    {PLAN_DISPLAY_NAMES[requiredPlan]} Plan Required
                </p>
                <p className="text-xs text-gray-500 mb-3">
                    Upgrade to unlock this feature
                </p>

                <Link
                    href="/dashboard/subscription"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-500 text-white text-xs font-medium rounded-lg hover:bg-orange-600 transition-colors"
                >
                    Upgrade Plan →
                </Link>
            </div>
        </div>
    );
}
