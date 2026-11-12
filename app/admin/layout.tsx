import type { Metadata } from "next";
import { AppShell } from "@/components/app/app-shell";
import { admin, notifications } from "@/lib/mock-data";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell
      role="admin"
      user={{ name: admin.name, email: admin.email, subtitle: admin.title }}
      notifications={notifications.admin}
      callPeer="Tunde Bakare"
    >
      {children}
    </AppShell>
  );
}
