/**
 * Change a user's role. The user must have signed in once (so they have a profile).
 *
 *   npm run db:set-role -- you@example.com admin
 *   npm run db:set-role -- advisor@example.com rep "Solar Advisor"
 */
try {
  process.loadEnvFile(".env.local");
} catch {}

import { drizzle } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import { Pool } from "pg";
import * as schema from "../lib/db/schema";

const [email, role, title] = process.argv.slice(2);
const roles = ["customer", "rep", "admin"] as const;

async function main() {
  if (!email || !roles.includes(role as (typeof roles)[number])) {
    throw new Error('Usage: npm run db:set-role -- <email> <customer|rep|admin> ["Job title"]');
  }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL!.replace("sslmode=require", "sslmode=verify-full") });
  const db = drizzle(pool, { schema });
  try {
    const updated = await db
      .update(schema.profiles)
      .set({ role: role as (typeof roles)[number], title: title ?? (role === "rep" ? "Solar Advisor" : role === "admin" ? "Administrator" : null), updated_at: new Date() })
      .where(sql`lower(${schema.profiles.email}) = lower(${email})`)
      .returning({ name: schema.profiles.name, role: schema.profiles.role });
    if (updated.length === 0) throw new Error(`No profile for ${email}. Sign in to the app once with that email, then run this again.`);
    console.log(`${updated[0].name} is now ${updated[0].role}.`);
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exitCode = 1;
});
