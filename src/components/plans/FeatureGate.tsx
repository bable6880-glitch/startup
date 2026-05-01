'use client';

import React from 'react';
import Link from 'next/link';

export type PlanId = 'starter' | 'growth' | 'pro' | 'elite';
export type PlanFeature = string;

const PLAN_ORDER: PlanId[] = ['starter', 'growth', 'pro', 'elite'];

const PLAN_DISPLAY_NAMES: Record<PlanId, string> = {
    starter: 'Starter',
    growth: 'Growth',
    pro: 'Pro',
    elite: 'Elite',
};

const PLAN_GRADIENTS: Record<PlanId, string> = {
    starter: 'from-gray-500 to-gray-700',
    growth: 'from-orange-500 to-amber-600',
    pro: 'from-blue-500 to-blue-700',
    elite: 'from-purple-600 to-purple-900',
};

const PLAN_ICONS: Record<PlanId, string> = {
    starter: '🌱',
    growth: '📈',
    pro: '⚡',
    elite: '👑',
};

interface FeatureGateProps {
    feature: PlanFeature;
    /** Pass null when loading — gate stays transparent until plan resolves */
    currentPlanId: PlanId | null;
    requiredPlan: PlanId;
    children: React.ReactNode;
    fallback?: React.ReactNode;
    /** If true, always render children (use when API is source of truth) */
    bypass?: boolean;
}

export function FeatureGate({
    currentPlanId,
    requiredPlan,
    children,
    fallback,
    bypass,
}: FeatureGateProps) {
    // If bypassed, or planId is null (still loading), always show children.
    // The server-side API is the real gate — this is just progressive UI enhancement.
    if (bypass || currentPlanId === null) {
        return <>{children}</>;
    }

    const hasAccess = PLAN_ORDER.indexOf(currentPlanId) >= PLAN_ORDER.indexOf(requiredPlan);

    if (hasAccess) {
        return <>{children}</>;
    }

    if (fallback) {
        return <>{fallback}</>;
    }

    // Premium locked state
    return <PremiumLockedOverlay requiredPlan={requiredPlan} />;
}

export function PremiumLockedOverlay({ requiredPlan }: { requiredPlan: PlanId }) {
    const gradient = PLAN_GRADIENTS[requiredPlan] ?? 'from-orange-500 to-amber-600';
    const icon = PLAN_ICONS[requiredPlan] ?? '👑';
    const name = PLAN_DISPLAY_NAMES[requiredPlan] ?? 'Premium';

    return (
        <div className="relative flex flex-col items-center justify-center min-h-[340px] rounded-2xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200">

            {/* Subtle grid pattern */}
            <div
                className="absolute inset-0 opacity-[0.04]"
                style={{
                    backgroundImage: 'linear-gradient(currentColor 1px, transparent 1px), linear-gradient(to right, currentColor 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                }}
            />

            {/* Glow orb */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-gradient-to-br ${gradient} opacity-[0.07] blur-3xl`} />

            <div className="relative z-10 flex flex-col items-center text-center px-8 py-12">
                {/* Plan badge */}
                <div className={`inline-flex items-center gap-2 bg-gradient-to-r ${gradient} text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg mb-6`}>
                    <span>{icon}</span>
                    <span>{name} Plan Required</span>
                </div>

                {/* Lock icon */}
                <div className="w-16 h-16 rounded-2xl bg-white shadow-xl border border-gray-100 flex items-center justify-center mb-5">
                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-2">
                    Unlock with {name}
                </h3>
                <p className="text-sm text-gray-500 max-w-xs mb-7">
                    This feature is available on the <strong>{name}</strong> plan and above. Upgrade to access it instantly.
                </p>

                <Link
                    href="/dashboard/subscription"
                    className={`inline-flex items-center gap-2 bg-gradient-to-r ${gradient} text-white font-semibold text-sm px-7 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5`}
                >
                    <span>View Plans</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                </Link>
            </div>
        </div>
    );
}

/** Compact inline lock badge — use for buttons / small elements */
export function FeatureLockedBadge({ requiredPlan }: { requiredPlan: PlanId }) {
    const name = PLAN_DISPLAY_NAMES[requiredPlan];
    return (
        <Link
            href="/dashboard/subscription"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-500 text-xs font-medium rounded-lg border border-gray-200 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-colors"
        >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            {name}+ Required
        </Link>
    );
}
