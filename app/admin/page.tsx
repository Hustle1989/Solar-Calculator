import type { Metadata } from "next";
import Link from "next/link";
import { BanknoteIcon, CalendarCheckIcon, InboxIcon, ReceiptIcon, UserPlusIcon, UsersIcon, WalletIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageHeader, SectionTitle, StatCard, UserAvatar } from "@/components/shared/ui-bits";
import { UnassignedQueue } from "@/components/admin/unassigned-queue";
import { nairaCompact, timeAgo } from "@/lib/format";
import { STAGES } from "@/lib/stages";
import { activity, customers, depositsCollectedKobo, reps } from "@/lib/mock-data";

export const metadata: Metadata = { title: "Admin overview" };

const activityIcon = { signup: UserPlusIcon, booking: CalendarCheckIcon, payment: BanknoteIcon, quote: ReceiptIcon };

export default function AdminHome() {
  const unassigned = customers.filter((c) => c.stage === "new");
  const active = customers.filter((c) => !["new", "completed"].includes(c.stage));
  const byStage = STAGES.map((s) => ({ ...s, count: customers.filter((c) => c.stage === s.id).length }));
  const max = Math.max(...byStage.map((s) => s.count));
  const team = reps.filter((r) => r.status === "active").map((r) => ({ r, n: customers.filter((c) => c.repId === r.id && c.stage !== "completed").length }));

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <PageHeader
        eyebrow="Operations"
        title="Overview"
        description="New sign-ups, your pipeline and how the team is doing."
        actions={
          <Button asChild variant="outline">
            <Link href="/admin/reps">
              <UserPlusIcon /> Invite advisor
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="New sign-ups (7 days)" value={14} hint="+27% vs last week" icon={UserPlusIcon} />
        <StatCard label="Unassigned" value={unassigned.length} hint="Oldest waiting 5h" icon={InboxIcon} />
        <StatCard label="Active projects" value={active.length} hint={`${customers.filter((c) => c.stage === "completed").length} completed`} icon={UsersIcon} />
        <StatCard label="Deposits collected" value={nairaCompact(depositsCollectedKobo)} hint="This month" icon={WalletIcon} highlight />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <UnassignedQueue initial={unassigned} />

          <section className="rounded-2xl border bg-card p-5">
            <SectionTitle>Pipeline by stage</SectionTitle>
            <ul className="space-y-3">
              {byStage.map((s) => (
                <li key={s.id} className="grid grid-cols-[120px_minmax(0,1fr)_32px] items-center gap-3 text-sm">
                  <span className="truncate text-muted-foreground">{s.id === "new" ? "Unassigned" : s.label}</span>
                  <span className="h-2.5 overflow-hidden rounded-full bg-muted">
                    <span className="block h-full rounded-full bg-gold-gradient" style={{ width: `${(s.count / max) * 100}%` }} />
                  </span>
                  <span className="text-right font-semibold tabular-nums">{s.count}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border bg-card p-5">
            <SectionTitle
              action={
                <Link href="/admin/reps" className="text-xs font-medium text-gold-text hover:underline">
                  Manage
                </Link>
              }
            >
              Advisor workload
            </SectionTitle>
            <ul className="space-y-4">
              {team.map(({ r, n }) => (
                <li key={r.id} className="flex items-center gap-3">
                  <UserAvatar name={r.name} online={r.online} />
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between text-sm">
                      <span className="truncate font-medium">{r.name}</span>
                      <span className="text-muted-foreground tabular-nums">{n} open</span>
                    </div>
                    <Progress value={Math.min(100, n * 20)} className="mt-1.5 h-1.5" />
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border bg-card p-5">
            <SectionTitle>Recent activity</SectionTitle>
            <ul className="space-y-4">
              {activity.map((a) => {
                const Icon = activityIcon[a.kind];
                return (
                  <li key={a.id} className="flex gap-3 text-sm">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-gold-soft text-gold-text">
                      <Icon className="size-4" />
                    </span>
                    <div>
                      <p>{a.text}</p>
                      <p className="text-xs text-muted-foreground">{timeAgo(a.at)}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
