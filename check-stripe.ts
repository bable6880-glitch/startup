import { db } from "./src/lib/db";
import { planConfigs } from "./src/lib/db/schema";

async function run() {
    const configs = await db.select({
        plan_id: planConfigs.planId,
        stripe_price_id: planConfigs.stripePriceId
    }).from(planConfigs);
    
    console.table(configs);
    process.exit(0);
}
run().catch(console.error);
