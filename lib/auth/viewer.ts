import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/server";
import { db, schema } from "@/lib/db";
import type { Profile, Role } from "@/lib/db/schema";

export type Viewer = { userId: string; email: string; profile: Profile };

export const ROLE_HOME: Record<Role, string> = { customer: "/dashboard", rep: "/rep", admin: "/admin" };

/**
 * The signed-in user and their profile, or null. Creates the profile (role customer, stage new) the
 * first time a user is seen. Cached per request, so layouts and pages can both call it.
 */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const { data: session } = await auth.getSession();
  const user = session?.user;
  if (!user) return null;

  let profile = await db.query.profiles.findFirst({ where: eq(schema.profiles.user_id, user.id) });
  if (!profile) {
    const [created] = await db
      .insert(schema.profiles)
      .values({ user_id: user.id, name: user.name?.trim() || user.email.split("@")[0], email: user.email })
      .onConflictDoNothing()
      .returning();
    if (created) {
      await db.insert(schema.stageEvents).values({ customer_id: user.id, to_stage: "new", changed_by: created.name });
      profile = created;
    } else {
      profile = await db.query.profiles.findFirst({ where: eq(schema.profiles.user_id, user.id) });
    }
  }
  if (!profile) return null;
  return { userId: user.id, email: user.email, profile };
});

/** For pages and layouts: redirects signed-out users to sign-in and wrong roles to their own home. */
export async function requireViewer(roles: Role[], returnTo?: string): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect(`/auth/sign-in${returnTo ? `?redirectTo=${encodeURIComponent(returnTo)}` : ""}`);
  if (!viewer.profile.active) redirect("/auth/sign-in?deactivated=1");
  if (!roles.includes(viewer.profile.role)) redirect(ROLE_HOME[viewer.profile.role]);
  return viewer;
}

export class AuthError extends Error {
  constructor(public status: 401 | 403, message: string) {
    super(message);
  }
}

/** For server actions: throws instead of redirecting. */
export async function assertViewer(roles: Role[]): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer || !viewer.profile.active) throw new AuthError(401, "Please sign in again.");
  if (!roles.includes(viewer.profile.role)) throw new AuthError(403, "You don't have access to do that.");
  return viewer;
}

/** Customers can see themselves; reps can see customers assigned to them; admins can see everyone. */
export function canAccessCustomer(viewer: Viewer, customer: Pick<Profile, "user_id" | "assigned_rep_id">) {
  if (viewer.profile.role === "admin") return true;
  if (viewer.profile.role === "rep") return customer.assigned_rep_id === viewer.userId;
  return customer.user_id === viewer.userId;
}
