import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./src/lib/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  const url = process.env.DATABASE_URL!;
  console.log("Using DB URL:", url.substring(0, 20) + "...");
  const sql = neon(url);
  const db = drizzle(sql, { schema });

  try {
    const { count } = await db.select({ count: schema.kitchens.id }).from(schema.kitchens).where(eq(schema.kitchens.status, "ACTIVE"));
    console.log("Success count:", count.length);
  } catch (err: any) {
    console.error("Error message:", err.message);
    console.error("Error string:", String(err));
    if (err.cause) {
        console.error("Cause name:", err.cause.name);
        console.error("Cause message:", err.cause.message);
    }
  }
}
main();
