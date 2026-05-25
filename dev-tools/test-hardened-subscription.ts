import dotenv from "dotenv";
import { eq } from "drizzle-orm";

// Load environment variables before any other imports
dotenv.config({ path: ".env.local" });

async function simulateWebhookProcessing(eventId: string, workerName: string) {
    const { db } = await import("../lib/db");
    const { stripeProcessedEvents } = await import("../lib/db/schema");

    console.log(`[${workerName}] Received event ${eventId}`);
    
    // Phase 1: Database-backed Event Check
    const existingEvent = await db.query.stripeProcessedEvents.findFirst({
        where: eq(stripeProcessedEvents.id, eventId),
    });

    if (existingEvent) {
        if (existingEvent.status === "completed") {
            console.log(`[${workerName}] ♻️ Event already processed: ${eventId}`);
            return { status: 200, duplicate: true };
        }
        if (existingEvent.status === "processing") {
            console.log(`[${workerName}] ⏳ Event currently processing (race condition): ${eventId}`);
            return { status: 202, pending: true };
        }
    }

    // Database Lock Insertion
    try {
        await db.insert(stripeProcessedEvents).values({
            id: eventId,
            type: "test.event",
            status: "processing",
        });
        console.log(`[${workerName}] 🔒 Acquired lock for ${eventId}`);
    } catch (err) {
        // Concurrent race lock hit
        console.log(`[${workerName}] 💥 Lock collision for ${eventId}, checking retry state...`);
        const retryCheck = await db.query.stripeProcessedEvents.findFirst({
            where: eq(stripeProcessedEvents.id, eventId),
        });
        if (retryCheck) {
            if (retryCheck.status === "completed") {
                console.log(`[${workerName}] ♻️ Event already processed on retry: ${eventId}`);
                return { status: 200, duplicate: true };
            }
            if (retryCheck.status === "processing") {
                console.log(`[${workerName}] ⏳ Event currently processing on retry: ${eventId}`);
                return { status: 202, pending: true };
            }
        }
        throw err;
    }

    // Phase 2: Transaction Execution (Mocked)
    console.log(`[${workerName}] ⚙️ Executing transaction for ${eventId}...`);
    // Simulate some work taking time
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Update to completed
    await db.update(stripeProcessedEvents)
        .set({
            status: "completed",
            processedAt: new Date(),
        })
        .where(eq(stripeProcessedEvents.id, eventId));
    
    console.log(`[${workerName}] ✅ Successfully completed event: ${eventId}`);
    return { status: 200, success: true };
}

async function runTests() {
    console.log("==================================================");
    console.log("🛡️ STARTING IDEMPOTENCY & CONCURRENCY TESTS");
    console.log("==================================================");

    const testEventId = `evt_test_${Date.now()}`;

    // Simulate 3 concurrent webhook requests arriving at the exact same millisecond
    console.log(`\n--- Test 1: Concurrent Webhook Race Condition (${testEventId}) ---`);
    const results = await Promise.allSettled([
        simulateWebhookProcessing(testEventId, "Worker 1"),
        simulateWebhookProcessing(testEventId, "Worker 2"),
        simulateWebhookProcessing(testEventId, "Worker 3")
    ]);

    console.log("\nResults from concurrent execution:");
    results.forEach((r, i) => {
        if (r.status === 'fulfilled') {
            console.log(`Worker ${i + 1}: Status ${r.value.status} (duplicate: ${r.value.duplicate || false}, pending: ${r.value.pending || false})`);
        } else {
            console.log(`Worker ${i + 1}: Failed with error`, r.reason);
        }
    });

    // Simulate a delayed duplicate webhook request after processing is complete
    console.log(`\n--- Test 2: Delayed Duplicate Webhook (${testEventId}) ---`);
    const duplicateResult = await simulateWebhookProcessing(testEventId, "Worker 4 (Delayed)");
    console.log(`Worker 4: Status ${duplicateResult.status} (duplicate: ${duplicateResult.duplicate || false})`);

    // Clean up test event
    console.log(`\n--- Cleaning up test data ---`);
    const { db } = await import("../lib/db");
    const { stripeProcessedEvents } = await import("../lib/db/schema");
    await db.delete(stripeProcessedEvents).where(eq(stripeProcessedEvents.id, testEventId));
    console.log("✅ Tests completed successfully.");

    process.exit(0);
}

runTests().catch(err => {
    console.error("Test failed:", err);
    process.exit(1);
});
