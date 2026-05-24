import { db } from './src/lib/db';
import { subscriptions, kitchens, planConfigs } from './src/lib/db/schema';
import * as dotenv from 'dotenv';

dotenv.config({ path: './.env.local' });

async function main() {
    console.log("DATABASE_URL present:", !!process.env.DATABASE_URL);
    
    try {
        const configs = await db.select().from(planConfigs);
        console.log("\n--- Plan Configs ---");
        console.table(configs.map(c => ({
            planId: c.planId,
            displayName: c.displayName,
            potluck: c.potluckUsesPerPeriod,
            khata: c.digitalKhata,
            chefAssistant: c.cookHelperAi
        })));
    } catch (e) {
        console.error("Failed to query planConfigs:", e);
    }

    try {
        const subs = await db.select().from(subscriptions).orderBy(subscriptions.createdAt);
        console.log("\n--- Subscriptions ---");
        console.table(subs.map(s => ({
            id: s.id,
            kitchenId: s.kitchenId,
            planId: s.planId,
            status: s.status,
            currentPeriodStart: s.currentPeriodStart,
            currentPeriodEnd: s.currentPeriodEnd,
            cancelledAt: s.cancelledAt
        })));
    } catch (e) {
        console.error("Failed to query subscriptions:", e);
    }

    try {
        const kits = await db.select().from(kitchens).orderBy(kitchens.createdAt);
        console.log("\n--- Kitchens ---");
        console.table(kits.map(k => ({
            id: k.id,
            name: k.name,
            planId: k.planId,
            status: k.status,
            isLocked: k.isLocked
        })));
    } catch (e) {
        console.error("Failed to query kitchens:", e);
    }
    
    process.exit(0);
}

main().catch(console.error);
