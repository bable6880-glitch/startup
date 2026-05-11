// src/app/dashboard/elite/layout.tsx
// Server component — guards Elite routes at server level.
// Uses the same firebase-token cookie pattern as subscription/actions.ts

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth/get-auth-user';
import { getKitchenPlanAccess } from '@/lib/plans/plan-access';
import { db } from '@/lib/db';
import { kitchens } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export default async function EliteLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // ── Read firebase-token cookie (same pattern as subscription/actions.ts) ──
    const cookieStore = await cookies();
    const token = cookieStore.get('firebase-token')?.value;

    if (!token) {
        redirect('/login?redirect=/dashboard/elite');
    }

    // ── Build pseudo-request for getAuthUser (established pattern) ──
    const headers = new Headers();
    headers.set('Authorization', `Bearer ${token}`);
    const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    const pseudoRequest = new NextRequest(baseUrl, { headers });

    const user = await getAuthUser(pseudoRequest);
    if (!user || (user.role !== 'COOK' && user.role !== 'ADMIN')) {
        redirect('/login?redirect=/dashboard/elite');
    }

    // ── Get cook's kitchen ──
    const kitchen = await db.query.kitchens.findFirst({
        where: eq(kitchens.ownerId, user.id),
    });

    if (!kitchen) {
        redirect('/dashboard');
    }

    // ── Server-side Elite plan verification ──
    const access = await getKitchenPlanAccess(kitchen.id);

    if (!access.isActive || access.planId !== 'elite') {
        redirect('/dashboard/subscription?error=elite_required');
    }

    return <>{children}</>;
}
