import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { kitchens, subscriptions, users } from '@/lib/db/schema';
import { eq, and, inArray, isNull, gt } from 'drizzle-orm';
import { verifyFirebaseToken } from '@/lib/auth/firebase-admin';

/**
 * Server-side route guard for the Elite dashboard.
 *
 * SECURITY: This guard is scoped to the CURRENT USER:
 *   1. Extracts the Firebase ID token from the Authorization header
 *   2. Verifies the token and finds the user in the database
 *   3. Finds the user's OWN kitchen (WHERE ownerId = user.id)
 *   4. Checks THAT kitchen's subscription for planId = 'elite'
 *   5. Only allows access if their own kitchen has an active elite subscription
 *
 * Non-Elite users are redirected to /dashboard/subscription.
 */
export default async function EliteLayout({ children }: { children: React.ReactNode }) {
    try {
        // 1. Extract token from Authorization header
        const headersList = await headers();
        const authHeader = headersList.get('authorization');
        const idToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

        if (!idToken) {
            // No token = not logged in, redirect to subscription page
            redirect('/dashboard/subscription');
        }

        // 2. Verify Firebase token and find user in DB
        const decoded = await verifyFirebaseToken(idToken);
        const user = await db.query.users.findFirst({
            where: eq(users.firebaseUid, decoded.uid),
            columns: { id: true, role: true, isActive: true },
        });

        if (!user || !user.isActive) {
            redirect('/dashboard/subscription');
        }

        // 3. Find the user's OWN kitchen
        const kitchen = await db.query.kitchens.findFirst({
            where: eq(kitchens.ownerId, user.id),
            columns: { id: true },
        });

        if (!kitchen) {
            redirect('/dashboard/subscription');
        }

        // 4. Check THAT kitchen's subscription for planId = 'elite'
        const eliteSub = await db.query.subscriptions.findFirst({
            where: and(
                eq(subscriptions.kitchenId, kitchen.id),
                eq(subscriptions.planId, 'elite'),
                inArray(subscriptions.status, ['ACTIVE', 'TRIALING']),
                isNull(subscriptions.cancelledAt),
                gt(subscriptions.currentPeriodEnd, new Date()),
            ),
            columns: { id: true },
        });

        if (!eliteSub) {
            redirect('/dashboard/subscription');
        }
    } catch (error) {
        // If it's a Next.js redirect, re-throw it (Next.js uses throw for redirects)
        if (error && typeof error === 'object' && 'digest' in error) {
            throw error;
        }
        // For any other error (token verification failure, DB error), redirect
        redirect('/dashboard/subscription');
    }

    return <>{children}</>;
}
