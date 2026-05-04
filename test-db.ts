import { db } from './src/lib/db';
import { planConfigs, subscriptions } from './src/lib/db/schema';

async function main() {
    const configs = await db.select().from(planConfigs);
    console.log("Plan Configs:", configs);

    const subs = await db.select().from(subscriptions).limit(5).orderBy((s) => s.createdAt);
    console.log("Subscriptions:", subs);
    
    process.exit(0);
}

main().catch(console.error);
