// ─── Extra Pack Pricing Config ──────────────────────────────────────────────
// One-time add-on packs that cooks can purchase to extend their plan limits.
// These are NOT subscriptions — they are one-time Stripe Checkout purchases.

export const ORDER_PACKS = [
    { size: 50,  priceRs: 499,   stripePriceId: process.env.STRIPE_ORDER_PACK_50  || null, label: '50 Extra Orders' },
    { size: 100, priceRs: 999,   stripePriceId: process.env.STRIPE_ORDER_PACK_100 || null, label: '100 Extra Orders' },
    { size: 200, priceRs: 2100,  stripePriceId: process.env.STRIPE_ORDER_PACK_200 || null, label: '200 Extra Orders' },
    { size: 400, priceRs: 3900,  stripePriceId: process.env.STRIPE_ORDER_PACK_400 || null, label: '400 Extra Orders' },
] as const;

export const POTLUCK_PACKS = [
    { size: 5,  priceRs: 1099, stripePriceId: process.env.STRIPE_POTLUCK_PACK_5  || null, label: '5 Group Deals' },
    { size: 11, priceRs: 2200, stripePriceId: process.env.STRIPE_POTLUCK_PACK_11 || null, label: '11 Group Deals' },
    { size: 15, priceRs: 2999, stripePriceId: process.env.STRIPE_POTLUCK_PACK_15 || null, label: '15 Group Deals' },
    { size: 20, priceRs: 3699, stripePriceId: process.env.STRIPE_POTLUCK_PACK_20 || null, label: '20 Group Deals' },
] as const;

export type OrderPackSize = typeof ORDER_PACKS[number]['size'];
export type PotluckPackSize = typeof POTLUCK_PACKS[number]['size'];
