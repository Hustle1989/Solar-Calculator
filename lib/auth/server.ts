// Neon Auth (Managed Better Auth) server instance. Used by the /api/auth proxy, proxy.ts and server code.
import { createNeonAuth } from "@neon/auth/next/server";
import { env } from "@/lib/env";

export const auth = createNeonAuth({
  baseUrl: env().NEON_AUTH_BASE_URL,
  cookies: { secret: env().NEON_AUTH_COOKIE_SECRET },
});
