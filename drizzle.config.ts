import { defineConfig } from "drizzle-kit";

// Local commands read .env.local; on the server the env vars are already set.
try {
  process.loadEnvFile(".env.local");
} catch {}

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  // Migrations use the direct (unpooled) connection.
  dbCredentials: { url: (process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL!).replace("sslmode=require", "sslmode=verify-full") },
  // Only manage our own tables; Neon Auth owns the neon_auth schema.
  schemaFilter: ["public"],
});
