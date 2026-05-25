import { db } from './src/lib/db';
import { subscriptions } from './src/lib/db/schema';
import { eq } from 'drizzle-orm';
import { invalidatePlanAccessCache } from './src/lib/plans/plan-access';

async function main() {
    // Find the most recently created active subscription
    const latestSub = await db.query.subscriptions.findFirst({
        where: eq(subscriptions.status, 'ACTIVE'),
        orderBy: (s, { desc }) => [desc(s.createdAt)],
    });

    if (latestSub) {
        console.log("Found latest subscription:", latestSub.id, "Plan:", latestSub.planId);
        
        await db.update(subscriptions)
            .set({ planId: 'elite', updatedAt: new Date() })
            .where(eq(subscriptions.id, latestSub.id));
            
        await invalidatePlanAccessCache(latestSub.kitchenId);
        
        console.log("✅ Successfully upgraded latest active subscription to Elite!");
    } else {
        console.log("No active subscriptions found.");
    }
    
    process.exit(0);
}

main().catch(console.error);
