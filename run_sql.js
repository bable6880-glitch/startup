const fs = require('fs');
const { Client } = require('pg');

async function run() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    });
    
    try {
        await client.connect();
        console.log("Connected to Neon DB");
        const sql = fs.readFileSync('src/lib/db/migrations/phase1_monetization.sql', 'utf8');
        await client.query(sql);
        console.log("Migration script executed successfully");
        
        // Let's do V1 verification now
        const res1 = await client.query(`
            SELECT plan_id, display_name, price_rs, billing_period_months,
                   menu_item_limit, analytics, support_level, branding_level,
                   potluck_uses_per_period, sort_order
            FROM plan_configs
            ORDER BY sort_order;
        `);
        console.log("V1 Result:");
        console.table(res1.rows);
        
        // V2 Verification
        const res2 = await client.query(`
            SELECT table_name FROM information_schema.tables 
            WHERE table_name IN ('plan_configs','commission_ledger','potluck_deals','potluck_orders','khata_entries','plan_usage_log')
        `);
        console.log("V2 Result:");
        console.table(res2.rows);

        // V3 Verification
        const res3 = await client.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'subscriptions'
        `);
        console.log("V3 Result:");
        console.table(res3.rows);

    } catch (e) {
        console.error("Error executing SQL:", e);
    } finally {
        await client.end();
    }
}

run();
