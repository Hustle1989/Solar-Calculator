import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDaysIcon, ReceiptIcon, UsersIcon, VideoIcon, WalletIcon, WrenchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader, SectionTitle, StatCard } from "@/components/shared/ui-bits";
import { CustomersTable } from "@/components/shared/customers-table";
import { nairaCompact } from "@/lib/format";
import { requireViewer } from "@/lib/auth/viewer";
import { listCustomers, listReps } from "@/lib/data";

export const metadata: Metadata = { title: "My customers" };

export default async function RepHome() {
  const viewer = await requireViewer(["rep", "admin"], "/rep");
  const isAdmin = viewer.profile.role === "admin";
  const [mine, reps] = await Promise.all([listCustomers(isAdmin ? {} : { repId: viewer.userId }), listReps()]);
  const open = mine.filter((c) => c.stage !== "completed");
  const pipeline = open.reduce((t, c) => t + c.estimateKobo, 0);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <PageHeader
        eyebrow={isAdmin ? "All advisors" : "Advisor workspace"}
        title={`Good day, ${viewer.profile.name.split(" ")[0]}`}
        description={isAdmin ? "You're seeing every customer because you're an admin." : "Your customers and what needs your attention."}
        actions={
          <Button asChild variant="outline">
            <Link href="/rep/availability">
              <CalendarDaysIcon /> Set availability
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active customers" value={open.length} hint={`${mine.length} total assigned`} icon={UsersIcon} />
        <StatCard label="Need a quote" value={mine.filter((c) => c.stage === "assigned").length} hint="Assigned, no quote sent yet" icon={ReceiptIcon} />
        <StatCard label="In delivery" value={mine.filter((c) => ["deposit_paid", "site_survey", "installation"].includes(c.stage)).length} hint="Deposit paid → installation" icon={WrenchIcon} />
        <StatCard label="Open pipeline" value={nairaCompact(pipeline)} hint="Estimated value in progress" icon={WalletIcon} highlight />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section>
          <SectionTitle>Customers</SectionTitle>
          <CustomersTable rows={mine} reps={reps.map((r) => ({ id: r.id, name: r.name, open: r.open }))} />
        </section>
        <section>
          <SectionTitle>Upcoming calls</SectionTitle>
          <EmptyState icon={VideoIcon} title="No calls yet" description="Calls your customers book will show here once booking is connected (Phase 4)." />
        </section>
      </div>
    </div>
  );
}
