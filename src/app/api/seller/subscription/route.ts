import { NextRequest, NextResponse } from 'next/server';
import { requireSeller } from '@/lib/auth/seller-guard';
import { getKitchenPlanAccess } from '@/lib/plans/plan-access';
import { db } from '@/lib/db';
import { subscriptions, meals } from '@/lib/db/schema';
import { eq, and, isNull, inArray } from 'drizzle-orm';
import { stripe } from '@/lib/stripe';
import { notifySystemMessage } from '@/services/notification.service';
import { invalidatePlanAccessCache } from '@/lib/plans/plan-access';
import { logger } from '@/lib/utils/logger';
import { count } from 'drizzle-orm';

export async function GET(req: NextRequest) {
    try {
        const guard = await requireSeller(req);
        if (!guard.ok) return guard.response;

        const access = await getKitchenPlanAccess(guard.kitchen.id);
        
        const menuCountResult = await db
            .select({ count: count() })
            .from(meals)
            .where(
                and(
                    eq(meals.kitchenId, guard.kitchen.id),
                    eq(meals.isAvailable, true),
                    isNull(meals.deletedAt)
                )
            );
        const menuCount = menuCountResult[0]?.count ?? 0;

        return NextResponse.json({
            success: true,
            subscription: access.subscription ? {
                id: access.subscription.id,
                planId: access.planId,
                status: access.subscription.status,
                currentPeriodStart: access.subscription.currentPeriodStart,
                currentPeriodEnd: access.subscription.currentPeriodEnd,
                cancelAtPeriodEnd: access.subscription.cancelAtPeriodEnd,
                cancelledAt: access.subscription.cancelledAt,
            } : null,
            
            planConfig: access.planConfig ? {
                displayName: access.planConfig.displayName,
                priceRs: access.planConfig.priceRs,
                billingPeriodMonths: access.planConfig.billingPeriodMonths,
                menuItemLimit: access.planConfig.menuItemLimit,
                monthlyOrderLimit: access.planConfig.monthlyOrderLimit,
                potluckUsesPerPeriod: access.planConfig.potluckUsesPerPeriod,
            } : null,
            
            usage: {
                ordersUsed: access.getOrdersUsed(),
                ordersLimit: access.getOrderLimit(),
                ordersRemaining: access.getOrdersRemaining(),
                ordersPercent: access.getOrderUsagePercent(),
                
                menuItemsUsed: menuCount,
                menuItemsLimit: access.getMenuLimit(),
                menuItemsPercent: access.getMenuUsagePercent(menuCount),
                
                potluckRemaining: access.getPotluckRemaining(),
                potluckLimit: access.planConfig?.potluckUsesPerPeriod ?? 0,
            },
            
            isFree: access.isFree,
            isActive: access.isActive,
            canUpgrade: access.planId !== 'elite',
            canCancel: !!(access.isActive && access.subscription && !access.subscription.cancelAtPeriodEnd),

            // Kitchen lock status (for KitchenLockedModal)
            isKitchenLocked: !!(guard.kitchen as any).isLocked,
            lockReason: (guard.kitchen as any).lockReason || null,
        });
    } catch (error) {
        logger.error("Failed to fetch subscription management data", { error });
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const guard = await requireSeller(req);
        if (!guard.ok) return guard.response;

        const subRecord = await db.query.subscriptions.findFirst({
            where: and(
                eq(subscriptions.kitchenId, guard.kitchen.id),
                inArray(subscriptions.status, ['ACTIVE', 'TRIALING', 'PAST_DUE']),
            ),
            with: { planConfig: true }
        });

        if (!subRecord) {
            return NextResponse.json({ error: "No active subscription found" }, { status: 404 });
        }

        if (subRecord.cancelAtPeriodEnd) {
            return NextResponse.json({ error: "Plan already scheduled for cancellation" }, { status: 409 });
        }

        // If Stripe recurring (starter plan typically autoRenews)
        if (subRecord.stripeSubscriptionId && subRecord.autoRenew) {
            await stripe.subscriptions.update(
                subRecord.stripeSubscriptionId,
                { cancel_at_period_end: true }
            );
        }

        await db.update(subscriptions)
            .set({ 
                cancelAtPeriodEnd: true, 
                updatedAt: new Date(),
                cancelledAt: new Date()
            })
            .where(eq(subscriptions.id, subRecord.id));

        await invalidatePlanAccessCache(guard.kitchen.id);

        const endDate = subRecord.currentPeriodEnd 
            ? subRecord.currentPeriodEnd.toLocaleDateString() 
            : 'the end of your billing cycle';
        const planName = subRecord.planConfig?.displayName ?? 'Premium';

        await notifySystemMessage(
            guard.user.id,
            `Plan cancellation scheduled. Your ${planName} remains active until ${endDate}.`
        );

        // Ideally log to admin_audit_log, but we'll just log standardly here as per prompt
        // If there's an insert method for adminAuditLog, we can do it:
        try {
            const { adminAuditLog } = await import('@/lib/db/schema');
            await db.insert(adminAuditLog).values({
                adminId: guard.user.id,
                action: 'SUBSCRIPTION_CANCEL_REQUESTED',
                targetType: 'SUBSCRIPTION',
                targetId: subRecord.id,
                details: JSON.stringify({ kitchenId: guard.kitchen.id, planId: subRecord.planId })
            });
        } catch (e) {
            logger.warn("Could not insert to adminAuditLog", { error: e });
        }

        return NextResponse.json({
            success: true,
            activeUntil: subRecord.currentPeriodEnd,
            message: 'Plan active until end of period'
        });

    } catch (error) {
        logger.error("Failed to cancel subscription", { error });
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
