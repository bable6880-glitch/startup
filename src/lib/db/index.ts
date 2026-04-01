import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL || "";

if (!connectionString) {
    console.warn("⚠️ DATABASE_URL environment variable is not set. Database connection will fail if used.");
}

// Enable connection caching for serverless/Lambda environments
neonConfig.fetchConnectionCache = true;

const sql = neon(connectionString || "postgresql://dummy:dummy@dummy/dummy");

export const db = drizzle(sql, { schema });

export type Database = typeof db;
