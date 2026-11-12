import type { Metadata } from "next";
import { CalendarClockIcon } from "lucide-react";
import { PageHeader, SectionTitle, UserAvatar } from "@/components/shared/ui-bits";
import { AvailabilityEditor } from "@/components/rep/availability-editor";
import { StartCallButton } from "@/components/call/start-call-button";
import { formatDay, formatTime } from "@/lib/format";
import { availability, bookings, DEMO_REP_ID, getCustomer } from "@/lib/mock-data";

export const metadata: Metadata = { title: "Availability" };

export default function AvailabilityPage() {
  const upcoming = bookings
    .filter((b) => b.repId === DEMO_REP_ID && b.status === "booked")
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader eyebrow="Availability" title="When can customers book you?" description="Customers can book 30-minute video calls inside these hours, at least 2 hours ahead and up to 14 days out." />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <AvailabilityEditor initial={availability} />
        <section>
          <SectionTitle>Booked calls</SectionTitle>
          <ul className="space-y-3">
            {upcoming.map((b) => {
              const c = getCustomer(b.customerId)!;
              return (
                <li key={b.id} className="rounded-xl border bg-card p-4">
                  <div className="flex items-center gap-3">
                    <UserAvatar name={c.name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{c.name}</p>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <CalendarClockIcon className="size-3" /> {formatDay(b.startsAt)} · {formatTime(b.startsAt)}
                      </p>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{b.topic}</p>
                  <StartCallButton peer={c.name} label="Start call" size="sm" className="mt-3" />
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
