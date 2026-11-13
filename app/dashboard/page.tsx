import Link from "next/link";
import { ArrowRightIcon, CalculatorIcon, CalendarDaysIcon, CheckCircle2Icon, HeadsetIcon, MessageSquareIcon, RadioIcon, ReceiptIcon, UploadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader, SectionTitle, UserAvatar, EmptyState } from "@/components/shared/ui-bits";
import { SystemSummary } from "@/components/shared/system-summary";
import { StartCallButton } from "@/components/call/start-call-button";
import { goldButton } from "@/components/shared/styles";
import { LiveProjectStatus, type CustomerStatusRow } from "@/components/customer/live-status";
import { PendingCalcSaver } from "@/components/customer/pending-calc-saver";
import { formatDate, naira } from "@/lib/format";
import { STAGES, stageIndex, type Stage } from "@/lib/stages";
import { requireViewer } from "@/lib/auth/viewer";
import { getCustomerRecord } from "@/lib/data";
import { live, loadLive } from "@/lib/realtime";

export default async function CustomerDashboard() {
  const viewer = await requireViewer(["customer"], "/dashboard");
  const [record, status] = await Promise.all([getCustomerRecord(viewer.userId), loadLive<CustomerStatusRow>(live.customerStatus(viewer.userId))]);
  if (!record) return null;
  const { profile, rep, calc, events } = record;
  const first = profile.name.split(" ")[0];
  const stage = profile.stage as Stage;

  const calcCard = (
    <Card>
      <CardHeader>
        <CardTitle>Your saved calculation</CardTitle>
        <CardDescription>{calc ? `Saved ${formatDate(calc.created_at)} from the load calculator` : "Nothing saved yet"}</CardDescription>
      </CardHeader>
      <CardContent>
        {calc ? (
          <SystemSummary lines={calc.lines} backupHours={calc.backup_hours} summary={calc.result} />
        ) : (
          <EmptyState
            icon={CalculatorIcon}
            title="Size your system"
            description="Use the load calculator to estimate the panels, batteries and inverter you need. It's saved here for your advisor."
            action={
              <Button asChild className={goldButton}>
                <Link href="/#calculator">Open the calculator</Link>
              </Button>
            }
          />
        )}
      </CardContent>
    </Card>
  );

  // ---------- just signed up: waiting for an advisor ----------
  if (stage === "new") {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <PendingCalcSaver />
        <PageHeader eyebrow="Welcome aboard" title={`Thanks for signing up, ${first}!`} description="Here's what happens next." />
        <div className="dark relative overflow-hidden rounded-2xl bg-night p-6 text-foreground sm:p-10">
          <div className="relative flex flex-col items-center text-center">
            <span className="grid size-24 animate-ring-pulse place-items-center rounded-full border-2 border-gold/70 text-gold-text">
              <HeadsetIcon className="size-10" strokeWidth={1.5} />
            </span>
            <p className="mt-6 inline-flex items-center gap-2 text-xs tracking-[0.25em] text-gold-text uppercase">
              <RadioIcon className="size-3.5" /> Matching you with an expert
            </p>
            <h2 className="mt-2 font-display text-2xl font-extrabold uppercase sm:text-3xl">Assigning your solar advisor…</h2>
            <p className="mt-3 max-w-lg text-muted-foreground">
              Usually within 2 working hours. This page updates by itself the moment your advisor is assigned.
            </p>
          </div>
        </div>
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          {calcCard}
          <Card>
            <CardHeader>
              <CardTitle>While you wait</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { done: true, text: "Account created" },
                { done: !!calc, text: "Calculation saved", href: calc ? undefined : "/#calculator" },
                { done: false, text: "Upload photos of your roof and meter", href: "/dashboard/media" },
                { done: false, text: "Meet your advisor on chat or video" },
              ].map((s) => (
                <div key={s.text} className="flex items-start gap-3 text-sm">
                  <CheckCircle2Icon className={s.done ? "mt-0.5 size-4 text-emerald-500" : "mt-0.5 size-4 text-muted-foreground/40"} />
                  {s.href && !s.done ? (
                    <Link href={s.href} className="font-medium text-gold-text hover:underline">
                      {s.text}
                    </Link>
                  ) : (
                    <span className={s.done ? "text-muted-foreground line-through" : ""}>{s.text}</span>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardContent className="pt-0">
            <LiveProjectStatus userId={viewer.userId} sealedQuery={status.sealedQuery} initialData={status.initialData} variant="tracker-only" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // ---------- assigned and beyond ----------
  const hasQuote = stageIndex(stage) >= stageIndex("quote_sent");
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PendingCalcSaver />
      <PageHeader
        eyebrow="My solar project"
        title={`Welcome back, ${first}`}
        description={[profile.property_type, profile.address, profile.city].filter(Boolean).join(" · ") || profile.email}
        actions={
          rep ? (
            <Button asChild className={goldButton}>
              <Link href="/dashboard/chat">
                Message {rep.name.split(" ")[0]} <ArrowRightIcon />
              </Link>
            </Button>
          ) : null
        }
      />

      <LiveProjectStatus userId={viewer.userId} sealedQuery={status.sealedQuery} initialData={status.initialData} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ReceiptIcon className="size-4 text-gold-text" />
                <CardTitle>Your quote</CardTitle>
              </div>
              <CardDescription>
                {hasQuote ? "Your advisor has sent your quote." : `${rep?.name ?? "Your advisor"} is reviewing your calculation and preparing your quote.`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {calc && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-muted/50 p-4">
                    <p className="text-xs text-muted-foreground uppercase">Estimated system cost</p>
                    <p className="mt-1 font-display text-xl font-bold">{naira(calc.result.totalKobo)}</p>
                  </div>
                  <div className="rounded-xl bg-gold-soft p-4 ring-1 ring-gold/30">
                    <p className="text-xs text-gold-text uppercase">Estimated deposit</p>
                    <p className="mt-1 font-display text-xl font-bold text-gold-text">{naira(calc.result.depositKobo)}</p>
                  </div>
                </div>
              )}
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                {hasQuote && (
                  <Button asChild className={goldButton}>
                    <Link href="/dashboard/quotes/q-1042">View quote (preview)</Link>
                  </Button>
                )}
                <Button asChild variant="outline">
                  <Link href="/dashboard/chat">Ask a question</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
          {calcCard}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardDescription className="flex items-center gap-1.5">
                <HeadsetIcon className="size-3.5" /> Your solar advisor
              </CardDescription>
            </CardHeader>
            <CardContent>
              {rep ? (
                <>
                  <div className="flex items-center gap-3">
                    <UserAvatar name={rep.name} size="lg" gold />
                    <div>
                      <p className="font-semibold">{rep.name}</p>
                      <p className="text-xs text-muted-foreground">{rep.title ?? "Solar Advisor"}</p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Button asChild variant="outline">
                      <Link href="/dashboard/chat">
                        <MessageSquareIcon /> Message
                      </Link>
                    </Button>
                    <StartCallButton peer={rep.name} />
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">We&apos;re assigning your advisor.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardDescription className="flex items-center gap-1.5">
                <CalendarDaysIcon className="size-3.5" /> Calls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">Book a 30-minute video call with your advisor.</p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/dashboard/book">Book a call</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <SectionTitle>Timeline</SectionTitle>
            </CardHeader>
            <CardContent>
              <ol className="relative space-y-4 border-l pl-5">
                {[...events].reverse().map((e) => (
                  <li key={e.id} className="relative">
                    <span className="absolute top-1 -left-[25px] grid size-3.5 place-items-center rounded-full bg-gold-gradient ring-4 ring-card" />
                    <p className="text-sm font-medium">{STAGES[stageIndex(e.to_stage)].label}</p>
                    <p className="text-xs text-muted-foreground">
                      {e.note ?? (e.changed_by ? `by ${e.changed_by}` : "")} · {formatDate(e.created_at, { day: "numeric", month: "short" })}
                    </p>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
