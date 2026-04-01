import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';
import { redis } from '@/lib/redis';
import { stripe } from '@/lib/stripe';
import pkg from '../../../../package.json';

const TIMEOUT_MS = 3000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`${label} check timed out`)), ms))
    ]);
}

export async function GET() {
    const checks = {
        db: 'pending',
        redis: 'pending',
        stripe: 'pending'
    };
    
    // Explicit typing for errors object
    const errors: Record<string, string> = {};

    const isProd = process.env.NODE_ENV === 'production';

    // 1. Database check
    const dbCheck = withTimeout(db.execute(sql`SELECT 1`), TIMEOUT_MS, 'db');

    // 2. Redis check
    const redisCheck = withTimeout(redis ? redis.ping() : Promise.resolve('No Redis'), TIMEOUT_MS, 'redis');

    // 3. Stripe check (balance is lightweight)
    const stripeCheck = withTimeout(stripe.balance.retrieve(), TIMEOUT_MS, 'stripe');

    const results = await Promise.allSettled([dbCheck, redisCheck, stripeCheck]);

    // Handle DB
    if (results[0].status === 'fulfilled') {
        checks.db = 'ok';
    } else {
        checks.db = 'error';
        const err = results[0].reason instanceof Error ? results[0].reason.message : String(results[0].reason);
        errors.db = isProd ? 'Check failed' : err;
    }

    // Handle Redis
    if (results[1].status === 'fulfilled') {
        checks.redis = 'ok';
    } else {
        checks.redis = 'error';
        const err = results[1].reason instanceof Error ? results[1].reason.message : String(results[1].reason);
        errors.redis = isProd ? 'Check failed' : err;
    }

    // Handle Stripe
    if (results[2].status === 'fulfilled') {
        checks.stripe = 'ok';
    } else {
        checks.stripe = 'error';
        const err = results[2].reason instanceof Error ? results[2].reason.message : String(results[2].reason);
        errors.stripe = isProd ? 'Check failed' : err;
    }

    const allOk = checks.db === 'ok' && checks.redis === 'ok' && checks.stripe === 'ok';

    return NextResponse.json(
        {
            status: allOk ? 'ok' : 'degraded',
            checks,
            ...(Object.keys(errors).length > 0 && { errors }),
            timestamp: new Date().toISOString(),
            version: pkg.version
        },
        { status: allOk ? 200 : 503 }
    );
}
