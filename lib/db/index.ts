import "server-only";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "@/lib/env";
import * as schema from "./schema";

// Cloudways runs a long-lived Node server, so a normal pg Pool over Neon's pooled URL is the right driver
// (real transactions, connection reuse). Reused across dev hot reloads.
const g = globalThis as unknown as { __solarPool?: Pool };

export const pool =
  g.__solarPool ??
  new Pool({
    // Neon URLs say sslmode=require; verify-full keeps the same checks without pg's warning.
    connectionString: env().DATABASE_URL.replace("sslmode=require", "sslmode=verify-full"),
    max: 10,
  });

if (!g.__solarPool) {
  // An idle connection error (e.g. the compute scaling to zero) must not crash the server.
  pool.on("error", (error: Error) => console.error("[pg pool]", error.message));
  g.__solarPool = pool;
}

export const db = drizzle(pool, { schema });
export { schema };
