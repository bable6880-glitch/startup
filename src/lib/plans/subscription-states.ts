// ─── Subscription State Machine ─────────────────────────────────────────────
// Maps raw DB subscription fields to logical application states.
// Used by dashboard UI, payment walls, and order guards.

export type SubscriptionState =
    | 'active'          // Paid and current — full access
    | 'trialing'        // Free trial — full access
    | 'past_due'        // Payment failed at renewal — grace period (3 days), show warning
    | 'grace_period'    // past_due > 3 days — reduced access, show payment wall
    | 'expired'         // period ended, not renewed — locked
    | 'cancelled'       // deliberately cancelled — locked at period end
    | 'none';           // Never had a subscription

export function getSubscriptionState(subscription: {
    status: string;
    currentPeriodEnd: Date | null;
    cancelledAt: Date | null;
} | null): SubscriptionState {
    if (!subscription) return 'none';

    // Cancelled but still in paid period — treat as active until period ends
    if (subscription.cancelledAt && subscription.currentPeriodEnd) {
        if (new Date() > subscription.currentPeriodEnd) return 'expired';
        return 'active';
    }

    if (subscription.status === 'ACTIVE') return 'active';
    if (subscription.status === 'TRIALING') return 'trialing';

    if (subscription.status === 'PAST_DUE') {
        // 3-day grace before full lock
        const failedAt = subscription.currentPeriodEnd ?? new Date();
        const daysPastDue = (Date.now() - failedAt.getTime()) / (1000 * 60 * 60 * 24);
        return daysPastDue > 3 ? 'grace_period' : 'past_due';
    }

    if (
        subscription.status === 'CANCELLED' ||
        subscription.status === 'EXPIRED' ||
        subscription.status === 'SUPERSEDED'
    ) {
        return 'expired';
    }

    return 'none';
}

/**
 * Can the cook accept new orders?
 * Active, trialing, and short past_due (grace period) allow orders.
 */
export function canAcceptOrders(state: SubscriptionState): boolean {
    return state === 'active' || state === 'trialing' || state === 'past_due';
}

/**
 * Does the cook have full feature access (AI, Khata, etc.)?
 * Only active and trialing states get full features.
 */
export function hasFullFeatureAccess(state: SubscriptionState): boolean {
    return state === 'active' || state === 'trialing';
}

/**
 * Should a payment wall be shown?
 */
export function shouldShowPaymentWall(state: SubscriptionState): boolean {
    return state === 'expired' || state === 'grace_period' || state === 'none';
}

/**
 * Get the UI reason for the payment wall.
 */
export function getPaymentWallReason(state: SubscriptionState): 'expired' | 'payment_failed' | 'grace_period' | 'none' {
    switch (state) {
        case 'expired':
        case 'cancelled':
            return 'expired';
        case 'past_due':
            return 'payment_failed';
        case 'grace_period':
            return 'grace_period';
        case 'none':
            return 'none';
        default:
            return 'none';
    }
}
