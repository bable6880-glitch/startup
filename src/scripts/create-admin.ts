/**
 * Smart Tiffin — Admin Account Creator
 *
 * This is the ONLY way to create an admin account.
 * There is no registration page. Run this once from your terminal.
 *
 * Usage:
 *   npx tsx scripts/create-admin.ts
 *
 * After running:
 *   1. Delete the password value from this file
 *   2. Commit the file without the password
 */

import { config } from "dotenv";
config({ path: ".env.local" });
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "../lib/db/schema";
import { adminUsers } from "../lib/db/schema";
import bcrypt from "bcryptjs";

neonConfig.poolQueryViaFetch = true;

// ─── EDIT THESE BEFORE RUNNING ──────────────────────────────────────────────
const ADMIN_EMAIL    = "bable6880@gmail.com";       // The email OTPs will be sent to
const ADMIN_USERNAME = "bravo91";
const ADMIN_PASSWORD = "Faiz786$$$786";     // DELETE THIS AFTER RUNNING
const ADMIN_NAME     = "Faiz";
const ADMIN_ROLE     = "super_admin";                // "admin" | "super_admin"
// ────────────────────────────────────────────────────────────────────────────

async function createAdmin() {
    if (!process.env.DATABASE_URL) {
        console.error("❌ DATABASE_URL is not set");
        process.exit(1);
    }

    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle(pool, { schema });

    console.log("🔐 Hashing password...");
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

    console.log("🗑️ Deleting all previous admin users...");
    await db.delete(adminUsers);

    console.log(`📝 Creating admin: ${ADMIN_EMAIL}`);
    const result = await db
        .insert(adminUsers)
        .values({
            email:        ADMIN_EMAIL,
            username:     ADMIN_USERNAME,
            passwordHash,
            displayName:  ADMIN_NAME,
            role:         ADMIN_ROLE,
            isActive:     true,
        })
        .onConflictDoNothing()
        .returning({ id: adminUsers.id, email: adminUsers.email });

    if (result.length === 0) {
        console.log("⚠️  Admin with this email/username already exists. Nothing changed.");
    } else {
        console.log(`✅ Admin created successfully!`);
        console.log(`   ID:    ${result[0].id}`);
        console.log(`   Email: ${result[0].email}`);
    }

    console.log("\n🔒 IMPORTANT: Delete ADMIN_PASSWORD from this file now.");

    await pool.end();
    process.exit(0);
}

createAdmin().catch((err) => {
    console.error("❌ Failed:", err.message);
    process.exit(1);
});
