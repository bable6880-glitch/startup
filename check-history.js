const postgres = require('postgres');
require('dotenv').config({ path: './.env.local' });

async function main() {
    const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

    try {
        const subHistory = await sql`SELECT * FROM subscription_history`;
        console.log("Subscription History count:", subHistory.length);
        console.log(JSON.stringify(subHistory, null, 2));

        const auditLogs = await sql`SELECT * FROM admin_audit_log`;
        console.log("Audit Logs count:", auditLogs.length);
        console.log(JSON.stringify(auditLogs, null, 2));

        const extraPacks = await sql`SELECT * FROM extra_packs`;
        console.log("Extra Packs count:", extraPacks.length);
        console.log(JSON.stringify(extraPacks, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await sql.end();
    }
}

main();
