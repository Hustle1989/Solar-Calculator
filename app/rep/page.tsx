import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDaysIcon, ReceiptIcon, UsersIcon, VideoIcon, WalletIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, SectionTitle, StatCard, UserAvatar } from "@/components/shared/ui-bits";
import { CustomersTable } from "@/components/shared/customers-table";
import { StartCallButton } from "@/components/call/start-call-button";
import { formatDay, formatTime, nairaCompact } from "@/lib/format";
import { bookings, customers, DEMO_REP_ID, getCustomer, getRep } from "@/lib/mock-data";

export const metadata: Metadata = { title: "My customers" };

export default function RepHome() {
  const me = getRep(DEMO_REP_ID)!;
  const mine = customers.filter((c) => c.repId === me.id);
  const calls = bookings.filter((b) => b.repId === me.id && b.status === "booked").sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  const pipeline = mine.filter((c) => c.stage !== "completed").reduce((t, c) => t + c.estimateKobo, 0);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <PageHeader
        eyebrow="Advisor workspace"
        title={`Good day, ${me.name.split(" ")[0]}`}
        description="Your customers, upcoming calls and what needs your attention."
        actions={
          <Button asChild variant="outline">
            <Link href="/rep/availability">
              <CalendarDaysIcon /> Set availability
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active customers" value={mine.filter((c) => c.stage !== "completed").length} hint={`${mine.length} total assigned`} icon={UsersIcon} />
        <StatCard label="Awaiting deposit" value={mine.filter((c) => c.stage === "quote_sent").length} hint="Quotes sent, not yet paid" icon={ReceiptIcon} />
        <StatCard label="Calls this week" value={calls.length} hint={calls[0] ? `Next: ${formatDay(calls[0].startsAt)}` : "None booked"} icon={VideoIcon} />
        <StatCard label="Open pipeline" value={nairaCompact(pipeline)} hint="Estimated value in progress" icon={WalletIcon} highlight />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section>
          <SectionTitle>Customers</SectionTitle>
          <CustomersTable rows={mine} />
        </section>
        <section>
          <SectionTitle
            action={
              <Link href="/rep/availability" className="text-xs font-medium text-gold-text hover:underline">
                Manage
              </Link>
            }
          >
            Upcoming calls
          </SectionTitle>
          <ul className="space-y-3">
            {calls.map((b) => {
              const c = getCustomer(b.customerId)!;
              return (
                <li key={b.id} className="rounded-xl border bg-card p-4">
                  <div className="flex items-center gap-3">
                    <UserAvatar name={c.name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDay(b.startsAt)} · {formatTime(b.startsAt)}
                      </p>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{b.topic}</p>
                  <div className="mt-3 flex gap-2">
                    <StartCallButton peer={c.name} label="Start call" size="sm" />
                    <Button asChild size="sm" variant="ghost">
                      <Link href={`/rep/customers/${c.id}`}>Open record</Link>
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
