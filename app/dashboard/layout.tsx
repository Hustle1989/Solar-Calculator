import type { Metadata } from "next";
import { AppShell } from "@/components/app/app-shell";
import { DEMO_CUSTOMER_ID, getCustomer, getRep, notifications } from "@/lib/mock-data";

export const metadata: Metadata = { title: "My solar project", robots: { index: false } };

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const me = getCustomer(DEMO_CUSTOMER_ID)!;
  const rep = getRep(me.repId)!;
  return (
    <AppShell
      role="customer"
      user={{ name: me.name, email: me.email, subtitle: `${me.propertyType} · ${me.city}` }}
      notifications={notifications.customer}
      callPeer={rep.name}
    >
      {children}
    </AppShell>
  );
}
