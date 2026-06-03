const postgres = require('postgres');
const sql = postgres('postgresql://neondb_owner:npg_csY1yR0mifqQ@ep-flat-scene-aiccxj32-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require');

async function run() {
    try {
        await sql`ALTER TYPE potluck_status_enum ADD VALUE IF NOT EXISTS 'SCHEDULED';`;
        console.log('Added SCHEDULED');
    } catch (e) {
        console.error(e.message);
    }
    
    try {
        await sql`ALTER TYPE potluck_status_enum ADD VALUE IF NOT EXISTS 'PAUSED';`;
        console.log('Added PAUSED');
    } catch (e) {
        console.error(e.message);
    }
    
    process.exit(0);
}

run();
