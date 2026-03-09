import { neon } from "@neondatabase/serverless";

async function main() {
    console.log("Testing Neon DB Connection...");
    const DATABASE_URL = 'postgresql://neondb_owner:npg_csY1yR0mifqQ@ep-flat-scene-aiccxj32-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
    const sql = neon(DATABASE_URL);

    try {
        console.log("Executing query...");
        const result = await sql`select count(*) from "kitchens" where "status" = 'ACTIVE' and "deleted_at" is null;`;
        console.log("Query success: ", result);
    } catch (error) {
        console.error("Query failed!");
        console.error("Error message:", error.message);
        console.error("Error full detail:", error);
        if (error.cause) {
            console.error("Error cause:", error.cause);
        }
    }

    console.log("\nTesting Google OAuth DNS...");
    try {
        const res = await fetch("https://oauth2.googleapis.com/token");
        console.log("Google fetch status:", res.status);
    } catch (e) {
        console.error("Google fetch error:", e.message);
        if (e.cause) console.error("Google fetch cause:", e.cause);
    }
}

main();
