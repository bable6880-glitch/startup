/**
 * Trial Lock Utility
 * 
 * Read-time enforcement of trial expiration. A kitchen is "trial locked" when:
 * 1. Its planId is 'trial', AND
 * 2. Its trialEndsAt timestamp is in the past
 * 
 * This approach avoids brittle cron jobs — the lock is evaluated fresh on every read.
 */

import { isFreeModeActive } from "@/config/free-mode";

export interface TrialLockable {
    planId: string | null;
    trialEndsAt: Date | string | null;
    isLocked?: boolean;
}

/**
 * Returns true if the kitchen's trial has expired and it should be locked.
 * Does NOT check the `isLocked` boolean — this function is the *source of truth*
 * for trial-based locking, independent of the DB flag.
 */
export function isKitchenTrialLocked(kitchen: TrialLockable): boolean {
    if (isFreeModeActive()) return false;
    if (kitchen.planId !== "trial") return false;
    if (!kitchen.trialEndsAt) return true; // trial plan but no end date = locked
    const endsAt = typeof kitchen.trialEndsAt === "string"
        ? new Date(kitchen.trialEndsAt)
        : kitchen.trialEndsAt;
    return endsAt.getTime() < Date.now();
}

/**
 * Returns the number of full days remaining in the trial.
 * Returns 0 if expired, negative if past expiry.
 */
export function trialDaysRemaining(kitchen: TrialLockable): number {
    if (kitchen.planId !== "trial" || !kitchen.trialEndsAt) return 0;
    const endsAt = typeof kitchen.trialEndsAt === "string"
        ? new Date(kitchen.trialEndsAt)
        : kitchen.trialEndsAt;
    return Math.ceil((endsAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
}

/**
 * Returns true if the kitchen is effectively locked — either by the DB flag
 * (`isLocked`) or by trial expiration. This is the canonical check for
 * whether a kitchen should be blocked from receiving orders.
 */
export function isKitchenEffectivelyLocked(kitchen: TrialLockable): boolean {
    if (isFreeModeActive()) return false;
    if (kitchen.isLocked) return true;
    return isKitchenTrialLocked(kitchen);
}
