/**
 * Seed premium plans into the database.
 *
 * Usage:   npx tsx src/scripts/seed-plans.ts
 * Env:     Reads DATABASE_URL from .env.local
 */
import "dotenv/config";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "../lib/db/schema";
import { planConfigs } from "../lib/db/schema";
import { eq, and } from "drizzle-orm";

neonConfig.poolQueryViaFetch = true;

async function seedPlans() {
    if (!process.env.DATABASE_URL) {
        console.error("❌ DATABASE_URL is not set");
        process.exit(1);
    }

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle(pool, { schema });

    console.log("🌱 Seeding premium plans (planConfigs)...\n");

    const plansToSeed = [
        {
            planId: "starter" as const,
            displayName: "Starter",
            priceRs: 599,
            billingPeriodMonths: 1,
            menuItemLimit: 7,
            monthlyOrderLimit: 50,
            commissionRate: "0.050",
            featuredBoostLevel: "none",
            prioritySupport: false,
            brandingTools: false,
            promotionsLevel: "none",
            advancedAnalytics: false,
            aiPricing: false,
            autoWhatsApp: false,
            dedicatedManager: false,
            chefAssistant: false,
            digitalKhata: false,
            potluckUsesPerPeriod: 1,
            isActive: true,
            sortOrder: 1,
        },
        {
            planId: "growth" as const,
            displayName: "Growth",
            priceRs: 2999,
            billingPeriodMonths: 6,
            menuItemLimit: 14,
            monthlyOrderLimit: 200,
            commissionRate: "0.030",
            featuredBoostLevel: "limited",
            prioritySupport: true,
            brandingTools: false,
            promotionsLevel: "none",
            advancedAnalytics: true,
            aiPricing: false,
            autoWhatsApp: false,
            dedicatedManager: false,
            chefAssistant: false,
            digitalKhata: false,
            potluckUsesPerPeriod: 3,
            isActive: true,
            sortOrder: 2,
        },
        {
            planId: "pro" as const,
            displayName: "Pro",
            priceRs: 5499,
            billingPeriodMonths: 12,
            menuItemLimit: null,
            monthlyOrderLimit: null,
            commissionRate: "0.000",
            featuredBoostLevel: "high",
            prioritySupport: true,
            brandingTools: true,
            promotionsLevel: "limited",
            advancedAnalytics: true,
            aiPricing: false,
            autoWhatsApp: false,
            dedicatedManager: false,
            chefAssistant: false,
            digitalKhata: false,
            potluckUsesPerPeriod: 10,
            isActive: true,
            sortOrder: 3,
        },
        {
            planId: "elite" as const,
            displayName: "Elite",
            priceRs: 11999,
            billingPeriodMonths: 12,
            menuItemLimit: null,
            monthlyOrderLimit: null,
            commissionRate: "0.000",
            featuredBoostLevel: "top",
            prioritySupport: true,
            brandingTools: true,
            promotionsLevel: "full",
            advancedAnalytics: true,
            aiPricing: true,
            autoWhatsApp: true,
            dedicatedManager: true,
            chefAssistant: true,
            digitalKhata: true,
            potluckUsesPerPeriod: -1,
            isActive: true,
            sortOrder: 4,
        }
    ];

    for (const plan of plansToSeed) {
        await db.insert(planConfigs)
            .values(plan)
            .onConflictDoUpdate({
                target: planConfigs.planId,
                set: {
                    displayName: plan.displayName,
                    priceRs: plan.priceRs,
                    billingPeriodMonths: plan.billingPeriodMonths,
                    menuItemLimit: plan.menuItemLimit,
                    monthlyOrderLimit: plan.monthlyOrderLimit,
                    commissionRate: plan.commissionRate,
                    featuredBoostLevel: plan.featuredBoostLevel,
                    prioritySupport: plan.prioritySupport,
                    brandingTools: plan.brandingTools,
                    promotionsLevel: plan.promotionsLevel,
                    advancedAnalytics: plan.advancedAnalytics,
                    aiPricing: plan.aiPricing,
                    autoWhatsApp: plan.autoWhatsApp,
                    dedicatedManager: plan.dedicatedManager,
                    chefAssistant: plan.chefAssistant,
                    digitalKhata: plan.digitalKhata,
                    potluckUsesPerPeriod: plan.potluckUsesPerPeriod,
                    isActive: plan.isActive,
                    sortOrder: plan.sortOrder,
                    updatedAt: new Date()
                }
            });
        console.log(`✅ Upserted plan: ${plan.displayName}`);
    }

    console.log("\n✅ All premium plans seeded successfully!");

    await pool.end();
    process.exit(0);
}

seedPlans().catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
});
