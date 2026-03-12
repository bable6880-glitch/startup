import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./src/lib/db/schema";
import { eq, and, isNull, sql } from "drizzle-orm";

async function main() {
  const url = process.env.DATABASE_URL!;
  const sqlClient = neon(url);
  const db = drizzle(sqlClient, { schema });

  try {
    const conditions = [
        eq(schema.kitchens.status, "ACTIVE"),
        isNull(schema.kitchens.deletedAt),
    ];
    
    console.log("Running dual query...");
    const [data, countResult] = await Promise.all([
        db.query.kitchens.findMany({
            where: and(...conditions),
            limit: 1,
            with: {
                owner: {
                    columns: { id: true, name: true, avatarUrl: true },
                },
            },
        }),
        db
            .select({ count: sql<number>`count(*)` })
            .from(schema.kitchens)
            .where(and(...conditions)),
    ]);
    console.log("Success! Data length:", data.length, "Count:", countResult[0].count);
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
