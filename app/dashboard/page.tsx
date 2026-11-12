import Link from "next/link";
import {
  ArrowRightIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  ClockIcon,
  HeadsetIcon,
  MessageSquareIcon,
  RadioIcon,
  ReceiptIcon,
  UploadIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StageBadge, StageTracker } from "@/components/shared/stage";
import { PageHeader, SectionTitle, UserAvatar } from "@/components/shared/ui-bits";
import { SystemSummary } from "@/components/shared/system-summary";
import { StartCallButton } from "@/components/call/start-call-button";
import { goldButton } from "@/components/shared/styles";
import { formatDate, formatDateTime, formatTime, naira } from "@/lib/format";
import { STAGES, stageIndex } from "@/lib/stages";
import {
  bookings,
  demoCalculation,
  demoStageEvents,
  DEMO_CUSTOMER_ID,
  getCustomer,
  getRep,
  quotes,
  quoteTotals,
} from "@/lib/mock-data";

function LiveDot() {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
        <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
      </span>
      Live
    </span>
  );
}

export default async function CustomerDashboard({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const { welcome } = await searchParams;
  const me = getCustomer(DEMO_CUSTOMER_ID)!;
  const first = me.name.split(" ")[0];

  if (welcome) return <WaitingForAdvisor firstName={first} />;

  const rep = getRep(me.repId)!;
  const quote = quotes.find((q) => q.customerId === me.id)!;
  const totals = quoteTotals(quote);
  const nextCall = bookings.find((b) => b.customerId === me.id && b.status === "booked");
  const stage = STAGES[stageIndex(me.stage)];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="My solar project"
        title={`Welcome back, ${first}`}
        description={`${me.propertyType} · ${me.address}, ${me.city}`}
        actions={
          <Button asChild className={goldButton}>
            <Link href={`/dashboard/quotes/${quote.id}`}>
              Review quote <ArrowRightIcon />
            </Link>
          </Button>
        }
      />

      {/* live status */}
      <Card className="gold-border overflow-visible">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-3">
            <CardTitle className="font-display text-lg">Project status</CardTitle>
            <StageBadge stage={me.stage} />
            <span className="ml-auto">
              <LiveDot />
            </span>
          </div>
          <CardDescription>{stage.description}</CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <StageTracker stage={me.stage} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          {/* quote */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ReceiptIcon className="size-4 text-gold-text" />
                <CardTitle>Quote {quote.number}</CardTitle>
                <span className="ml-auto rounded-full bg-gold-soft px-2.5 py-0.5 text-xs font-medium text-gold-text">Awaiting your approval</span>
              </div>
              <CardDescription>
                Sent by {rep.name} on {formatDate(quote.createdAt)} · valid until {formatDate(quote.validUntil)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-muted/50 p-4">
                  <p className="text-xs text-muted-foreground uppercase">System total</p>
                  <p className="mt-1 font-display text-xl font-bold">{naira(totals.total)}</p>
                </div>
                <div className="rounded-xl bg-gold-soft p-4 ring-1 ring-gold/30">
                  <p className="text-xs text-gold-text uppercase">Deposit ({quote.depositPercent}%)</p>
                  <p className="mt-1 font-display text-xl font-bold text-gold-text">{naira(totals.deposit)}</p>
                </div>
                <div className="rounded-xl bg-muted/50 p-4">
                  <p className="text-xs text-muted-foreground uppercase">Balance after install</p>
                  <p className="mt-1 font-display text-xl font-bold">{naira(totals.balance)}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Button asChild className={goldButton}>
                  <Link href={`/dashboard/quotes/${quote.id}`}>Accept &amp; pay deposit</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/dashboard/chat">Ask a question</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* calculation */}
          <Card>
            <CardHeader>
              <CardTitle>Your saved calculation</CardTitle>
              <CardDescription>Saved {formatDate(demoCalculation.createdAt)} from the load calculator</CardDescription>
            </CardHeader>
            <CardContent>
              <SystemSummary lines={demoCalculation.lines} backupHours={demoCalculation.backupHours} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* advisor */}
          <Card>
            <CardHeader>
              <CardDescription className="flex items-center gap-1.5">
                <HeadsetIcon className="size-3.5" /> Your solar advisor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <UserAvatar name={rep.name} online={rep.online} size="lg" gold />
                <div>
                  <p className="font-semibold">{rep.name}</p>
                  <p className="text-xs text-muted-foreground">{rep.title} · usually replies in under an hour</p>
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
            </CardContent>
          </Card>

          {/* next call */}
          <Card>
            <CardHeader>
              <CardDescription className="flex items-center gap-1.5">
                <CalendarDaysIcon className="size-3.5" /> Next call
              </CardDescription>
            </CardHeader>
            <CardContent>
              {nextCall ? (
                <>
                  <p className="font-display text-lg font-bold">{formatDateTime(nextCall.startsAt)}</p>
                  <p className="text-sm text-muted-foreground">
                    30 min · {nextCall.topic}
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Button disabled variant="secondary" title="Opens 10 minutes before the call">
                      <ClockIcon /> Join at {formatTime(new Date(nextCall.startsAt.getTime() - 10 * 60_000))}
                    </Button>
                    <Button asChild variant="outline">
                      <Link href="/dashboard/book">Reschedule</Link>
                    </Button>
                  </div>
                </>
              ) : (
                <Button asChild variant="outline" className="w-full">
                  <Link href="/dashboard/book">Book a call</Link>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* activity */}
          <Card>
            <CardHeader>
              <SectionTitle>Timeline</SectionTitle>
            </CardHeader>
            <CardContent>
              <ol className="relative space-y-4 border-l pl-5">
                {[...demoStageEvents].reverse().map((e) => (
                  <li key={e.stage} className="relative">
                    <span className="absolute top-1 -left-[25px] grid size-3.5 place-items-center rounded-full bg-gold-gradient ring-4 ring-card" />
                    <p className="text-sm font-medium">{STAGES[stageIndex(e.stage)].label}</p>
                    <p className="text-xs text-muted-foreground">
                      {e.note ?? `by ${e.by}`} · {formatDate(e.at, { day: "numeric", month: "short" })}
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

function WaitingForAdvisor({ firstName }: { firstName: string }) {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader eyebrow="Welcome aboard" title={`Thanks for signing up, ${firstName}!`} description="Your calculation is saved. Here's what happens next." />

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
            Usually within 2 working hours. This page updates by itself, and we&apos;ll email you the moment your
            advisor is assigned.
          </p>
          <div className="mt-6">
            <LiveDot />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardHeader>
            <CardTitle>Your saved calculation</CardTitle>
            <CardDescription>Your advisor will start from this.</CardDescription>
          </CardHeader>
          <CardContent>
            <SystemSummary lines={demoCalculation.lines} backupHours={demoCalculation.backupHours} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>While you wait</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { done: true, text: "Calculation saved" },
              { done: false, text: "Upload photos of your roof and meter", href: "/dashboard/media", icon: UploadIcon },
              { done: false, text: "Meet your advisor on chat or video" },
              { done: false, text: "Review your quote" },
            ].map((s) => (
              <div key={s.text} className="flex items-start gap-3 text-sm">
                <CheckCircle2Icon className={s.done ? "mt-0.5 size-4 text-emerald-500" : "mt-0.5 size-4 text-muted-foreground/40"} />
                {s.href ? (
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
          <StageTracker stage="new" />
        </CardContent>
      </Card>
    </div>
  );
}
