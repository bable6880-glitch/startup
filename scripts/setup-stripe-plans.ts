import "dotenv/config";
import Stripe from "stripe";
import { db } from "../src/lib/db";
import { planConfigs } from "../src/lib/db/schema";
import { eq } from "drizzle-orm";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2024-06-20" as any,
});

async function setupStripePlans() {
    console.log("Setting up Stripe Products and Prices...");

    const plans = await db.query.planConfigs.findMany({
        where: eq(planConfigs.isActive, true),
    });

    for (const plan of plans) {
        if (!plan.stripePriceId) {
            console.log(`Creating Stripe product and price for ${plan.displayName}...`);

            // Use 'recurring' for 1-month Starter plan, 'payment' (one_time) for others
            const isRecurring = plan.billingPeriodMonths === 1;

            const product = await stripe.products.create({
                name: `Smart Tiffin ${plan.displayName} Plan`,
                description: `Access to ${plan.displayName} features`,
            });

            const priceParams: Stripe.PriceCreateParams = {
                product: product.id,
                unit_amount: plan.priceRs * 100, // in cents/paise
                currency: "pkr",
            };

            if (isRecurring) {
                priceParams.recurring = {
                    interval: "month",
                    interval_count: 1,
                };
            }

            const price = await stripe.prices.create(priceParams);

            await db.update(planConfigs)
                .set({ stripePriceId: price.id })
                .where(eq(planConfigs.id, plan.id));

            console.log(`✅ Created price ${price.id} for ${plan.displayName} (Mode: ${isRecurring ? "subscription" : "payment"})`);
        } else {
            console.log(`⏭️ ${plan.displayName} already has a Stripe Price ID: ${plan.stripePriceId}`);
        }
    }

    console.log("Stripe setup complete.");
    process.exit(0);
}

setupStripePlans().catch(console.error);
