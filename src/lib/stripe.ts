import Stripe from 'stripe';

const stripeKey = (process.env.STRIPE_SECRET_KEY ?? '').replace(/(^"|"$)/g, '');

if (!stripeKey) {
    throw new Error(
        '[Stripe] STRIPE_SECRET_KEY environment variable is not set. ' +
        'Add it to your .env.local file and AWS Amplify env vars.'
    );
}

export const stripe = new Stripe(stripeKey, {
    apiVersion: '2026-02-25.clover',
    typescript: true,
});