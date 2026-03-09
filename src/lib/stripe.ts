import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error(
        '[Stripe] STRIPE_SECRET_KEY environment variable is not set. ' +
        'Add it to your .env.local file and AWS Amplify env vars.'
    );
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2026-02-25.clover',
    typescript: true,
});