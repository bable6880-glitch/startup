const { Client } = require('pg');
require('dotenv').config({ path: './.env.local' });

async function main() {
    console.log("Database URL present:", !!process.env.DATABASE_URL);
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log("Connected to Neon DB successfully!");

        const planConfigsRes = await client.query('SELECT plan_id, display_name, potluck_uses_per_period, digital_khata, cook_helper_ai FROM plan_configs');
        console.log("\n--- Plan Configs ---");
        console.table(planConfigsRes.rows);

        const subsRes = await client.query('SELECT id, user_id, kitchen_id, plan_id, status, current_period_start, current_period_end FROM subscriptions ORDER BY created_at DESC LIMIT 10');
        console.log("\n--- Subscriptions ---");
        console.table(subsRes.rows);

        const kitchensRes = await client.query('SELECT id, name, plan_id, status, is_locked FROM kitchens LIMIT 10');
        console.log("\n--- Kitchens ---");
        console.table(kitchensRes.rows);

    } catch (e) {
        console.error("Database connection failed:", e);
    } finally {
        await client.end();
    }
}

main();
