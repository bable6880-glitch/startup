/**
 * Smart Tiffin — Subscription & Kitchen planId Repair Migration Script
 *
 * This script audits all active subscriptions in the database against Stripe's source of truth.
 * If any mismatches are found (e.g., planId in subscriptions or kitchens is old/incorrect),
 * it repairs the records synchronously and clears active plan access caches.
 *
 * Usage:
 *   npx tsx src/scripts/repair-subscriptions.ts [--dry-run]
 */

import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
    const args = process.argv.slice(2);
    const dryRun = args.includes("--dry-run");

    console.log("==================================================");
    console.log(`🧹 STARTING SUBSCRIPTION REPAIR & AUDIT MIGRATION`);
    console.log(`🛡️  MODE: ${dryRun ? "DRY RUN (No database updates)" : "LIVE WRITE (Repairing database)"}`);
    console.log("==================================================\n");

    if (!process.env.DATABASE_URL) {
        console.error("❌ DATABASE_URL is not set. Exiting.");
        process.exit(1);
    }

    try {
        // Dynamically import database and stripe drivers to guarantee env vars are loaded first
        const { db } = await import("../lib/db");
        const { subscriptions, kitchens, planConfigs } = await import("../lib/db/schema");
        const { eq, and, inArray } = await import("drizzle-orm");
        const { stripe } = await import("../lib/stripe");
        const { invalidatePlanAccessCache } = await import("../lib/plans/plan-access");

        // 1. Fetch active subscriptions from the DB
        console.log("🔍 Fetching active subscription records from DB...");
        const dbSubs = await db.query.subscriptions.findMany({
            where: inArray(subscriptions.status, ["ACTIVE", "TRIALING", "PAST_DUE"]),
        });

        console.log(`📊 Found ${dbSubs.length} active subscription records to audit.\n`);

        let auditedCount = 0;
        let repairedCount = 0;
        let skippedCount = 0;
        let failedCount = 0;

        const repairedLog: Array<any> = [];
        const failedLog: Array<any> = [];

        for (const sub of dbSubs) {
            auditedCount++;
            console.log(`[${auditedCount}/${dbSubs.length}] Auditing Sub ID: ${sub.id} (Kitchen: ${sub.kitchenId})...`);

            try {
                // Scenario A: Non-Stripe Subscription (e.g. FREE_TRIAL)
                if (!sub.stripeSubscriptionId) {
                    console.log(`   ℹ️  Non-Stripe subscription (Method: ${sub.paymentMethod}).`);
                    
                    // Verify kitchen planId matches subscription planId
                    const kitchen = await db.query.kitchens.findFirst({
                        where: eq(kitchens.id, sub.kitchenId),
                    });

                    if (kitchen && kitchen.planId !== sub.planId) {
                        console.log(`   ⚠️  Mismatch: Kitchen planId is '${kitchen.planId}', expected '${sub.planId}'`);
                        if (!dryRun) {
                            await db.update(kitchens)
                                .set({ planId: sub.planId as any, updatedAt: new Date() })
                                .where(eq(kitchens.id, sub.kitchenId));
                            await invalidatePlanAccessCache(sub.kitchenId);
                            repairedCount++;
                            repairedLog.push({
                                subId: sub.id,
                                kitchenId: sub.kitchenId,
                                type: "NON_STRIPE_KITCHEN_SYNC",
                                repairedFrom: kitchen.planId,
                                repairedTo: sub.planId,
                            });
                            console.log(`   🟢 Repaired: Kitchen planId updated to '${sub.planId}'`);
                        } else {
                            repairedCount++;
                            repairedLog.push({
                                subId: sub.id,
                                kitchenId: sub.kitchenId,
                                type: "NON_STRIPE_KITCHEN_SYNC",
                                repairedFrom: kitchen.planId,
                                repairedTo: sub.planId,
                            });
                            console.log(`   🔍 [Dry Run] Would repair: Kitchen planId updated to '${sub.planId}'`);
                        }
                    } else {
                        console.log("   ✅ Synced.");
                        skippedCount++;
                    }
                    continue;
                }

                // Scenario B: Stripe Subscription
                console.log(`   🔌 Fetching subscription status from Stripe: ${sub.stripeSubscriptionId}...`);
                const stripeSub = await stripe.subscriptions.retrieve(sub.stripeSubscriptionId);
                const stripePriceId = stripeSub.items.data[0]?.price.id;

                if (!stripePriceId) {
                    throw new Error("No price item found on Stripe subscription");
                }

                console.log(`   Resolved Stripe Price ID: ${stripePriceId}`);

                // Map Stripe Price to planConfig
                const planConfig = await db.query.planConfigs.findFirst({
                    where: eq(planConfigs.stripePriceId, stripePriceId),
                });

                if (!planConfig) {
                    console.warn(`   ⚠️  No planConfig found in DB for Stripe price ID: ${stripePriceId}`);
                    skippedCount++;
                    continue;
                }

                const resolvedPlanId = planConfig.planId;
                console.log(`   Resolved internal Plan ID: ${resolvedPlanId}`);

                // Check for mismatches
                const kitchen = await db.query.kitchens.findFirst({
                    where: eq(kitchens.id, sub.kitchenId),
                });

                const subMismatch = sub.planId !== resolvedPlanId;
                const kitchenMismatch = kitchen ? kitchen.planId !== resolvedPlanId : false;

                if (subMismatch || kitchenMismatch) {
                    console.log(`   ⚠️  Plan mismatch found! DB Subscription: '${sub.planId}', Kitchen: '${kitchen?.planId}', Stripe: '${resolvedPlanId}'`);

                    if (!dryRun) {
                        // Apply transactional repair
                        await db.transaction(async (tx) => {
                            if (subMismatch) {
                                await tx.update(subscriptions)
                                    .set({ planId: resolvedPlanId as any, updatedAt: new Date() })
                                    .where(eq(subscriptions.id, sub.id));
                            }
                            if (kitchenMismatch) {
                                await tx.update(kitchens)
                                    .set({ planId: resolvedPlanId as any, updatedAt: new Date() })
                                    .where(eq(kitchens.id, sub.kitchenId));
                            }
                        });

                        await invalidatePlanAccessCache(sub.kitchenId);
                        repairedCount++;
                        repairedLog.push({
                            subId: sub.id,
                            kitchenId: sub.kitchenId,
                            type: "STRIPE_PLAN_SYNC",
                            repairedFrom: { sub: sub.planId, kitchen: kitchen?.planId },
                            repairedTo: resolvedPlanId,
                        });
                        console.log(`   🟢 Repaired subscription and kitchen planIds successfully!`);
                    } else {
                        repairedCount++;
                        repairedLog.push({
                            subId: sub.id,
                            kitchenId: sub.kitchenId,
                            type: "STRIPE_PLAN_SYNC",
                            repairedFrom: { sub: sub.planId, kitchen: kitchen?.planId },
                            repairedTo: resolvedPlanId,
                        });
                        console.log(`   🔍 [Dry Run] Would repair subscriptions and kitchens planIds to: '${resolvedPlanId}'`);
                    }
                } else {
                    console.log("   ✅ Synced.");
                    skippedCount++;
                }

            } catch (err: any) {
                failedCount++;
                failedLog.push({
                    subId: sub.id,
                    kitchenId: sub.kitchenId,
                    error: err.message,
                });
                console.error(`   ❌ Failed auditing subscription:`, err.message);
            }
        }

        console.log("\n" + "═".repeat(60));
        console.log("📊 SUBSCRIPTION AUDIT COMPLETE SUMMARY");
        console.log("═".repeat(60));
        console.log(`Audited: ${auditedCount}`);
        console.log(`Repaired: ${repairedCount}`);
        console.log(`Skipped: ${skippedCount}`);
        console.log(`Failed: ${failedCount}`);
        console.log("═".repeat(60));

        if (repairedLog.length > 0) {
            console.log("\n🟢 REPAIRED RECORDS LOG:");
            console.table(repairedLog);
        }

        if (failedLog.length > 0) {
            console.log("\n❌ FAILED RECORDS LOG:");
            console.table(failedLog);
        }

        process.exit(0);

    } catch (e: any) {
        console.error("\n❌ Repair script execution crashed:", e.message);
        process.exit(1);
    }
}

main();
