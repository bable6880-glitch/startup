import { db } from "./src/lib/db";
import { checkAccess, getKitchenPlanAccess } from "./src/lib/plans/check-access";
import { kitchens, subscriptions, users } from "./src/lib/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

async function runTests() {
    console.log("=== RUNNING V9 TESTS AGAINST REAL DB ===");
    
    // Create a dummy user
    const userId = uuidv4();
    await db.insert(users).values({
        id: userId,
        firebaseUid: userId,
        email: `test-${userId}@example.com`,
        name: "Test User",
        role: "COOK",
    });

    const testKitchenIds: string[] = [];

    // Helper to create kitchen + sub
    async function setupTest(planId: string, ordersUsed: number, potluckRemaining: number, status: string = 'ACTIVE') {
        const kitchenId = uuidv4();
        testKitchenIds.push(kitchenId);
        
        await db.insert(kitchens).values({
            id: kitchenId,
            ownerId: userId,
            name: `Test Kitchen ${planId}`,
            slug: `test-kitchen-${kitchenId}`,
            city: "Test City",
            citySlug: "test-city",
            status: "ACTIVE",
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        if (planId !== 'free') {
            await db.insert(subscriptions).values({
                userId,
                kitchenId,
                planId: planId as any,
                planType: "BASE_MONTHLY",
                status: status as any,
                paymentMethod: "STRIPE",
                currentPeriodStart: new Date(),
                currentPeriodEnd: new Date(Date.now() + 86400000),
                autoRenew: false,
                ordersUsedThisMonth: ordersUsed,
                potluckUsesRemaining: potluckRemaining,
            });
        }
        return kitchenId;
    }

    try {
        // TEST 1: Starter cook, ordersUsedThisMonth=50
        const kit1 = await setupTest('starter', 50, 2);
        const res1 = await checkAccess(kit1, 'ORDER');
        console.log("TEST 1: Starter cook, ordersUsedThisMonth=50");
        console.log("Expected: { allowed: false, reason: 'ORDER_LIMIT_EXCEEDED' }");
        console.log("Actual:", res1);
        console.log(res1.allowed === false && res1.reason === 'ORDER_LIMIT_EXCEEDED' ? "PASS\n" : "FAIL\n");

        // TEST 2: Starter cook, potluckUsesRemaining=0
        const kit2 = await setupTest('starter', 0, 0);
        const res2 = await checkAccess(kit2, 'POTLUCK_CREATE');
        console.log("TEST 2: Starter cook, potluckUsesRemaining=0");
        console.log("Expected: { allowed: false, reason: 'POTLUCK_LIMIT_EXCEEDED' }");
        console.log("Actual:", res2);
        console.log(res2.allowed === false && res2.reason === 'POTLUCK_LIMIT_EXCEEDED' ? "PASS\n" : "FAIL\n");

        // TEST 3: Growth cook tries digital_khata
        const kit3 = await setupTest('growth', 0, 10);
        const res3 = await checkAccess(kit3, 'digital_khata');
        console.log("TEST 3: Growth cook tries digital_khata");
        console.log("Expected: { allowed: false, upgradeRequired: 'pro' }");
        console.log("Actual:", res3);
        console.log(res3.allowed === false && res3.upgradeRequired === 'pro' ? "PASS\n" : "FAIL\n");

        // TEST 4: Elite cook potluck
        const kit4 = await setupTest('elite', 0, 9999);
        const res4 = await checkAccess(kit4, 'POTLUCK_CREATE');
        console.log("TEST 4: Elite cook potluck");
        console.log("Expected: { allowed: true, limit: null }");
        console.log("Actual:", res4);
        console.log(res4.allowed === true && res4.limit === null ? "PASS\n" : "FAIL\n");

        // TEST 5: Expired subscription
        const kit5 = await setupTest('starter', 0, 0, 'EXPIRED');
        const planAccess5 = await getKitchenPlanAccess(kit5);
        console.log("TEST 5: Expired subscription (fallback to free tier)");
        console.log("Expected: isFree: true, isActive: false");
        console.log(`Actual: isFree: ${planAccess5.isFree}, isActive: ${planAccess5.isActive}`);
        console.log(planAccess5.isFree === true && planAccess5.isActive === false ? "PASS\n" : "FAIL\n");

    } catch (error) {
        console.error("TEST FAILED WITH ERROR:", error);
    } finally {
        // Cleanup
        for (const k of testKitchenIds) {
            await db.delete(kitchens).where(eq(kitchens.id, k));
        }
        await db.delete(users).where(eq(users.id, userId));
        console.log("Cleanup complete");
        process.exit(0);
    }
}

runTests().catch(console.error);
