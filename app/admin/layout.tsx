import type { Metadata } from "next";
import { AppShell } from "@/components/app/app-shell";
import { requireViewer } from "@/lib/auth/viewer";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireViewer(["admin"], "/admin");
  return (
    <AppShell
      role="admin"
      user={{ name: profile.name, email: profile.email, subtitle: profile.title ?? "Administrator" }}
      notifications={[]}
      callPeer="An advisor"
    >
      {children}
    </AppShell>
  );
}
