import type { Metadata } from "next";
import { AppShell } from "@/components/app/app-shell";
import { DEMO_REP_ID, getRep, notifications } from "@/lib/mock-data";

export const metadata: Metadata = { title: "Advisor workspace", robots: { index: false } };

export default function RepLayout({ children }: { children: React.ReactNode }) {
  const me = getRep(DEMO_REP_ID)!;
  return (
    <AppShell
      role="rep"
      user={{ name: me.name, email: me.email, subtitle: me.title }}
      notifications={notifications.rep}
      callPeer="Kemi Adeyemi"
    >
      {children}
    </AppShell>
  );
}
