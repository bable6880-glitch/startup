/**
 * Migration Guard
 * Warns against accidental production manipulation but doesn't hard-block explicit deployments.
 */

if (process.env.DATABASE_URL?.includes('neon.tech') && process.env.NODE_ENV === 'production') {
    console.warn('\x1b[33m%s\x1b[0m', 'WARN: Running migrations against production Neon database. Confirm this is intentional.');
}
