const postgres = require('postgres');
require('dotenv').config({ path: './.env.local' });

async function main() {
    const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

    try {
        const tables = await sql`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `;
        
        console.log("Tables list:");
        for (const r of tables) {
            const countRes = await sql`SELECT count(*) FROM ${sql(r.table_name)}`;
            const count = countRes[0].count;
            console.log(`Table: ${r.table_name} - Rows: ${count}`);
            if (count > 0 && r.table_name !== 'users' && r.table_name !== 'kitchens') {
                const sample = await sql`SELECT * FROM ${sql(r.table_name)} LIMIT 3`;
                console.log(JSON.stringify(sample, null, 2));
            }
        }
    } catch (e) {
        console.error(e);
    } finally {
        await sql.end();
    }
}

main();
