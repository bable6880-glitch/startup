/**
 * Smart Tiffin — Stripe Pack Products Setup Script
 *
 * This script creates Stripe Products and Prices for each extra pack.
 * Run ONCE per environment (test/live), then copy the price IDs into your .env.local.
 *
 * Usage:
 *   npx tsx scripts/setup-stripe-packs.ts
 *
 * Requirements:
 *   STRIPE_SECRET_KEY in .env.local
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2024-06-20" as any,
});

const PACKS = [
    // Order Packs (one-time payments)
    { envKey: "STRIPE_ORDER_PACK_50",   name: "Smart Tiffin Extra Orders — 50",   amount: 499,  type: "ORDER_PACK",   size: 50  },
    { envKey: "STRIPE_ORDER_PACK_100",  name: "Smart Tiffin Extra Orders — 100",  amount: 999,  type: "ORDER_PACK",   size: 100 },
    { envKey: "STRIPE_ORDER_PACK_200",  name: "Smart Tiffin Extra Orders — 200",  amount: 2100, type: "ORDER_PACK",   size: 200 },
    { envKey: "STRIPE_ORDER_PACK_400",  name: "Smart Tiffin Extra Orders — 400",  amount: 3900, type: "ORDER_PACK",   size: 400 },
    // Potluck (Group Deal) Packs
    { envKey: "STRIPE_POTLUCK_PACK_5",  name: "Smart Tiffin Extra Deals — 5",     amount: 1099, type: "POTLUCK_PACK", size: 5  },
    { envKey: "STRIPE_POTLUCK_PACK_11", name: "Smart Tiffin Extra Deals — 11",    amount: 2200, type: "POTLUCK_PACK", size: 11 },
    { envKey: "STRIPE_POTLUCK_PACK_15", name: "Smart Tiffin Extra Deals — 15",    amount: 2999, type: "POTLUCK_PACK", size: 15 },
    { envKey: "STRIPE_POTLUCK_PACK_20", name: "Smart Tiffin Extra Deals — 20",    amount: 3699, type: "POTLUCK_PACK", size: 20 },
];

async function setupPacks() {
    if (!process.env.STRIPE_SECRET_KEY) {
        console.error("❌ STRIPE_SECRET_KEY is not set in .env.local");
        process.exit(1);
    }

    const isLive = process.env.STRIPE_SECRET_KEY.startsWith("sk_live_");
    console.log(`\n🔑 Using Stripe ${isLive ? "LIVE" : "TEST"} mode\n`);

    const envLines: string[] = [];

    for (const pack of PACKS) {
        console.log(`📦 Creating: ${pack.name} (Rs. ${pack.amount})...`);

        // Create product
        const product = await stripe.products.create({
            name: pack.name,
            metadata: {
                type: pack.type,
                size: String(pack.size),
                platform: "smart_tiffin",
            },
        });

        // Create price (one-time payment, PKR)
        const price = await stripe.prices.create({
            product: product.id,
            unit_amount: pack.amount * 100, // Stripe uses smallest currency unit
            currency: "pkr",
            metadata: {
                type: pack.type,
                size: String(pack.size),
            },
        });

        console.log(`   ✅ Product: ${product.id}`);
        console.log(`   ✅ Price:   ${price.id}`);

        envLines.push(`${pack.envKey}=${price.id}`);
    }

    console.log("\n" + "═".repeat(60));
    console.log("📋 Add these to your .env.local:\n");
    console.log(envLines.join("\n"));
    console.log("\n" + "═".repeat(60));

    process.exit(0);
}

setupPacks().catch((err) => {
    console.error("❌ Failed:", err.message);
    process.exit(1);
});
