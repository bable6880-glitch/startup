import { config } from "dotenv";
config({ path: ".env.local" });

import { db } from "./src/lib/db";
import { kitchens } from "./src/lib/db/schema";
import { eq } from "drizzle-orm";

async function main() {
  console.log("Using DB URL:", process.env.DATABASE_URL ? "SET" : "UNSET");
  try {
    const list = await db.select().from(kitchens).where(eq(kitchens.status, "ACTIVE")).limit(1);
    console.log("Success findMany", list.length);
    
    // Test count query that is failing in logs
    const { count } = await db.select({ count: kitchens.id }).from(kitchens).where(eq(kitchens.status, "ACTIVE"));
    console.log("Success count", count.length);
  } catch (err: any) {
    console.error("Error message:", err.message);
    console.error("Error cause:", err.cause);
    console.error("Error JSON:", JSON.stringify(err, null, 2));
  }
}
main();
