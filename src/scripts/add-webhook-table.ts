/**
 * DDL sync script to create stripe_processed_events table if it doesn't exist yet.
 * Run using: npx tsx scripts/add-webhook-table.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
    console.log("Checking and syncing database for stripe_processed_events table...");
    try {
        // Dynamically import db AFTER dotenv config has executed to prevent empty DATABASE_URL
        const { db } = await import("../lib/db");
        const { sql } = await import("drizzle-orm");

        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS stripe_processed_events (
                id VARCHAR(255) PRIMARY KEY,
                type VARCHAR(100) NOT NULL,
                status VARCHAR(20) NOT NULL,
                error TEXT,
                processed_at TIMESTAMP WITH TIME ZONE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
            )
        `);
        // Add indexes if missing
        await db.execute(sql`
            CREATE INDEX IF NOT EXISTS idx_stripe_event_status ON stripe_processed_events (status)
        `);
        await db.execute(sql`
            CREATE INDEX IF NOT EXISTS idx_stripe_event_created ON stripe_processed_events (created_at)
        `);
        console.log("🟢 stripe_processed_events table verified/created successfully!");
        process.exit(0);
    } catch (e: any) {
        console.error("❌ Failed to sync database tables:", e.message);
        process.exit(1);
    }
}

main();
