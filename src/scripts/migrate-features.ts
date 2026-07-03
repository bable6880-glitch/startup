import "dotenv/config";
import { Pool, neonConfig } from "@neondatabase/serverless";

neonConfig.poolQueryViaFetch = true;

async function migrate() {
    if (!process.env.DATABASE_URL) {
        console.error("❌ DATABASE_URL is not set");
        process.exit(1);
    }

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    console.log("🚀 Starting feature migrations...");

    try {
        // 1. Alter subscription_plan_type
        console.log("Updating subscription_plan_type enum...");
        await pool.query(`ALTER TYPE subscription_plan_type ADD VALUE IF NOT EXISTS 'TRIAL';`);

        // 2. Alter plan_config_enum
        console.log("Updating plan_config_enum...");
        await pool.query(`ALTER TYPE plan_config_enum ADD VALUE IF NOT EXISTS 'trial';`);

        // 3. Add trial_ends_at to kitchens
        console.log("Adding trial_ends_at to kitchens table...");
        await pool.query(`ALTER TABLE "kitchens" ADD COLUMN IF NOT EXISTS "trial_ends_at" timestamp with time zone;`);

        // 4. Create cities table
        console.log("Creating cities table...");
        await pool.query(`
            CREATE TABLE IF NOT EXISTS "cities" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "name" varchar(100) NOT NULL,
                "slug" varchar(100) NOT NULL,
                "created_by_kitchen_id" uuid REFERENCES "kitchens"("id") ON DELETE SET NULL,
                "created_at" timestamp with time zone DEFAULT now() NOT NULL
            );
        `);
        
        console.log("Adding index to cities slug...");
        await pool.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "cities_slug_idx" ON "cities" ("slug");
        `);
        await pool.query(`
            CREATE INDEX IF NOT EXISTS "cities_created_idx" ON "cities" ("created_at");
        `);

        console.log("✅ All feature migrations completed successfully!");
    } catch (err) {
        console.error("❌ Migration failed:", err);
    } finally {
        await pool.end();
    }
}

migrate();
