const postgres = require('postgres');
require('dotenv').config({ path: './.env.local' });

async function main() {
    const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

    try {
        const allSubs = await sql`SELECT * FROM subscriptions`;
        console.log("All Subscriptions count:", allSubs.length);
        console.log(JSON.stringify(allSubs, null, 2));

        const allKitchens = await sql`SELECT * FROM kitchens`;
        console.log("All Kitchens count:", allKitchens.length);
        console.log(JSON.stringify(allKitchens, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await sql.end();
    }
}

main();
