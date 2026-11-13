// Redirects signed-out visitors to sign-in and refreshes sessions. This is only the first gate:
// every page, server action and route handler still checks the session and role itself.
import { auth } from "@/lib/auth/server";

export default auth.middleware({
  loginUrl: "/auth/sign-in",
  // /api/auth and the /auth/* sign-in views are public by default.
  // /api/live answers 401 itself, so signed-out live-query renewals get JSON, not a redirect.
  publicRoutes: ["/", "/privacy", "/invite", "/api/live"],
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)"],
};
