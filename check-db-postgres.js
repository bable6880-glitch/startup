const postgres = require('postgres');
require('dotenv').config({ path: './.env.local' });

async function main() {
    console.log("Database URL present:", !!process.env.DATABASE_URL);
    const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

    try {
        console.log("Connected to Neon DB successfully!");

        const planConfigs = await sql`SELECT plan_id, display_name, potluck_uses_per_period, digital_khata, cook_helper_ai FROM plan_configs`;
        console.log("\n--- Plan Configs ---");
        console.table(planConfigs);

        const subs = await sql`SELECT id, user_id, kitchen_id, plan_id, status, current_period_start, current_period_end FROM subscriptions ORDER BY created_at DESC LIMIT 10`;
        console.log("\n--- Subscriptions ---");
        console.table(subs);

        const kitchens = await sql`SELECT id, name, plan_id, status, is_locked FROM kitchens LIMIT 10`;
        console.log("\n--- Kitchens ---");
        console.table(kitchens);

    } catch (e) {
        console.error("Database connection failed:", e);
    } finally {
        await sql.end();
    }
}

main();
