import type { Metadata } from "next";
import { AppShell } from "@/components/app/app-shell";
import { requireViewer } from "@/lib/auth/viewer";
import { getProfile } from "@/lib/data";

export const metadata: Metadata = { title: "My solar project", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireViewer(["customer"], "/dashboard");
  const rep = profile.assigned_rep_id ? await getProfile(profile.assigned_rep_id) : undefined;
  return (
    <AppShell
      role="customer"
      user={{ name: profile.name, email: profile.email, subtitle: [profile.property_type, profile.city].filter(Boolean).join(" · ") || "Customer" }}
      notifications={[]}
      callPeer={rep?.name ?? "Your advisor"}
    >
      {children}
    </AppShell>
  );
}
