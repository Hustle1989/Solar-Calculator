import type { Metadata } from "next";
import Link from "next/link";
import { BanknoteIcon, CalendarCheckIcon, InboxIcon, ReceiptIcon, UserPlusIcon, UsersIcon, WrenchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PageHeader, SectionTitle, StatCard, UserAvatar } from "@/components/shared/ui-bits";
import { UnassignedQueue, type QueueRow } from "@/components/admin/unassigned-queue";
import { formatNumber, timeAgo } from "@/lib/format";
import { STAGES, stageLabel, type Stage } from "@/lib/stages";
import { requireViewer } from "@/lib/auth/viewer";
import { getAdminOverview, listReps } from "@/lib/data";
import { live, loadLive } from "@/lib/realtime";

export const metadata: Metadata = { title: "Admin overview" };

const eventIcon: Partial<Record<Stage, typeof UserPlusIcon>> = { new: UserPlusIcon, assigned: UsersIcon, quote_sent: ReceiptIcon, deposit_paid: BanknoteIcon, site_survey: CalendarCheckIcon, installation: WrenchIcon };

export default async function AdminHome() {
  const viewer = await requireViewer(["admin"], "/admin");
  const [overview, reps, queue] = await Promise.all([getAdminOverview(), listReps(), loadLive<QueueRow>(live.adminQueue())]);
  const n = (s: Stage) => overview.byStage.get(s) ?? 0;
  const byStage = STAGES.map((s) => ({ ...s, count: n(s.id) }));
  const max = Math.max(1, ...byStage.map((s) => s.count));
  const activeReps = reps.filter((r) => r.status === "active");
  const active = byStage.filter((s) => !["new", "completed"].includes(s.id)).reduce((t, s) => t + s.count, 0);

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
        <StatCard label="New sign-ups (7 days)" value={formatNumber(overview.signupsThisWeek)} icon={UserPlusIcon} />
        <StatCard label="Unassigned" value={n("new")} hint="Waiting for an advisor" icon={InboxIcon} />
        <StatCard label="Active projects" value={active} hint={`${n("completed")} completed`} icon={UsersIcon} />
        <StatCard label="Awaiting deposit" value={n("quote_sent")} hint="Payments connect in Phase 3" icon={BanknoteIcon} highlight />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <UnassignedQueue userId={viewer.userId} sealedQuery={queue.sealedQuery} initialData={queue.initialData} reps={activeReps.map((r) => ({ id: r.id, name: r.name, open: r.open }))} />

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
            {activeReps.length === 0 ? (
              <p className="text-sm text-muted-foreground">No advisors yet.</p>
            ) : (
              <ul className="space-y-4">
                {activeReps.map((r) => (
                  <li key={r.id} className="flex items-center gap-3">
                    <UserAvatar name={r.name} />
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between text-sm">
                        <span className="truncate font-medium">{r.name}</span>
                        <span className="text-muted-foreground tabular-nums">{r.open} open</span>
                      </div>
                      <Progress value={Math.min(100, r.open * 20)} className="mt-1.5 h-1.5" />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border bg-card p-5">
            <SectionTitle>Recent activity</SectionTitle>
            <ul className="space-y-4">
              {overview.activity.map((a) => {
                const Icon = eventIcon[a.to] ?? UsersIcon;
                return (
                  <li key={a.id} className="flex gap-3 text-sm">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-gold-soft text-gold-text">
                      <Icon className="size-4" />
                    </span>
                    <div>
                      <p>
                        <span className="font-medium">{a.customer}</span>: {a.to === "new" ? "signed up" : a.note ?? `moved to ${stageLabel(a.to)}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {timeAgo(a.at)}
                        {a.by && a.to !== "new" ? ` · by ${a.by}` : ""}
                      </p>
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
