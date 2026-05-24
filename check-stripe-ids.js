const postgres = require('postgres');
require('dotenv').config({ path: './.env.local' });

async function main() {
    const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

    try {
        const res = await sql`SELECT plan_id, display_name, stripe_price_id FROM plan_configs`;
        console.table(res);
    } catch (e) {
        console.error(e);
    } finally {
        await sql.end();
    }
}

main();
