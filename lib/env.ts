// Server environment, validated once. Fails fast with a readable message if something is missing.
// Imported by the auth proxy too, so it must not import "server-only".
import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().url(),
  NEON_AUTH_BASE_URL: z.string().url(),
  NEON_AUTH_COOKIE_SECRET: z.string().min(32, "NEON_AUTH_COOKIE_SECRET must be at least 32 characters"),
  NEON_REALTIME_URL: z.string().url(),
  NEON_REALTIME_SECRET: z.string().min(1),
});

type Env = z.infer<typeof schema>;
let cached: Env | undefined;

export function env(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const missing = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("\n  ");
    throw new Error(`Invalid environment variables:\n  ${missing}\nRun \`neon env pull\` and check .env.local.`);
  }
  cached = parsed.data;
  return cached;
}
