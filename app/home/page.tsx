import { redirect } from "next/navigation";
import { getViewer, ROLE_HOME } from "@/lib/auth/viewer";

export const dynamic = "force-dynamic";

/** Post-sign-in landing: sends each role to its own home. */
export default async function HomeRedirect() {
  const viewer = await getViewer();
  if (!viewer) redirect("/auth/sign-in");
  if (!viewer.profile.active) redirect("/auth/sign-in?deactivated=1");
  redirect(ROLE_HOME[viewer.profile.role]);
}
