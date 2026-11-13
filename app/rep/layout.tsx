import type { Metadata } from "next";
import { AppShell } from "@/components/app/app-shell";
import { requireViewer } from "@/lib/auth/viewer";

export const metadata: Metadata = { title: "Advisor workspace", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function RepLayout({ children }: { children: React.ReactNode }) {
  // Admins can open advisor pages too (e.g. a customer record from the admin customer list).
  const { profile } = await requireViewer(["rep", "admin"], "/rep");
  return (
    <AppShell
      role="rep"
      user={{ name: profile.name, email: profile.email, subtitle: profile.title ?? (profile.role === "admin" ? "Administrator" : "Solar Advisor") }}
      notifications={[]}
      callPeer="A customer"
    >
      {children}
    </AppShell>
  );
}
