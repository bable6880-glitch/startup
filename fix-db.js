const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });

async function fixDB() {
    const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });
    try {
        console.log("Dropping plan_id column from subscriptions completely...");
        await sql`ALTER TABLE "subscriptions" DROP COLUMN IF EXISTS "plan_id" CASCADE;`;
        console.log("Database column plan_id removed successfully.");
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await sql.end();
    }
}

fixDB();
