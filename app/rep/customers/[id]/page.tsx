import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, Building2Icon, CalendarDaysIcon, MailIcon, MapPinIcon, MessageSquareIcon, PhoneIcon, VideoIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StageBadge } from "@/components/shared/stage";
import { EmptyState, UserAvatar } from "@/components/shared/ui-bits";
import { SystemSummary } from "@/components/shared/system-summary";
import { StartCallButton } from "@/components/call/start-call-button";
import { StageControl } from "@/components/rep/stage-control";
import { QuoteBuilder } from "@/components/quotes/quote-builder";
import { MediaManager } from "@/components/media/media-manager";
import { formatDate, formatDateTime } from "@/lib/format";
import { STAGES, stageIndex } from "@/lib/stages";
import {
  bookings,
  demoCalculation,
  demoStageEvents,
  DEMO_CUSTOMER_ID,
  getCustomer,
  getRep,
  loadPresets,
  media,
  quotes,
  type Customer,
  type LoadPreset,
} from "@/lib/mock-data";

export const metadata: Metadata = { title: "Customer" };

const presetFor: Record<Customer["propertyType"], LoadPreset> = {
  Home: "residential",
  Office: "business",
  Shop: "business",
  Warehouse: "industrial",
  School: "specialized",
};

export default async function RepCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = getCustomer(id);
  if (!c) notFound();
  const rep = getRep(c.repId);
  const isDemo = c.id === DEMO_CUSTOMER_ID;
  const calc = isDemo
    ? demoCalculation
    : { lines: loadPresets[presetFor[c.propertyType]].lines, backupHours: loadPresets[presetFor[c.propertyType]].backupHours, createdAt: c.signedUp };
  const events = isDemo
    ? demoStageEvents
    : STAGES.slice(0, stageIndex(c.stage) + 1).map((s, i) => ({ stage: s.id, at: new Date(c.signedUp.getTime() + i * 2 * 86_400_000), by: i === 0 ? c.name : rep?.name ?? "Admin" }));
  const quote = quotes.find((q) => q.customerId === c.id);
  const calls = bookings.filter((b) => b.customerId === c.id).sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime());
  const siteMedia = isDemo ? media.filter((m) => m.kind === "site") : [];
  const progressMedia = isDemo ? media.filter((m) => m.kind === "progress") : [];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/rep">
          <ArrowLeftIcon /> My customers
        </Link>
      </Button>

      {/* header */}
      <div className="flex flex-col gap-5 rounded-2xl border bg-card p-5 sm:p-6 lg:flex-row lg:items-center">
        <div className="flex items-center gap-4">
          <UserAvatar name={c.name} size="lg" className="size-14" gold />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-extrabold tracking-tight">{c.name}</h1>
              <StageBadge stage={c.stage} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Customer since {formatDate(c.signedUp)} · {rep ? `Advisor: ${rep.name}` : "No advisor yet"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 lg:ml-auto">
          <Button asChild variant="outline">
            <Link href="/rep/chat">
              <MessageSquareIcon /> Message
            </Link>
          </Button>
          <StartCallButton peer={c.name} />
        </div>
      </div>

      <Tabs defaultValue="overview" className="gap-6">
        <TabsList className="w-full justify-start overflow-x-auto sm:w-fit">
          <TabsTrigger value="overview" className="px-4">Overview</TabsTrigger>
          <TabsTrigger value="quote" className="px-4">Quote</TabsTrigger>
          <TabsTrigger value="media" className="px-4">Media</TabsTrigger>
          <TabsTrigger value="calls" className="px-4">Calls</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Project stage</CardTitle>
                  <CardDescription>Advance the customer as work progresses. They see changes live.</CardDescription>
                </CardHeader>
                <CardContent>
                  <StageControl initialStage={c.stage} events={events} repName={rep?.name ?? "Admin"} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Saved calculation</CardTitle>
                  <CardDescription>From the load calculator on {formatDate(calc.createdAt)}</CardDescription>
                </CardHeader>
                <CardContent>
                  <SystemSummary lines={calc.lines} backupHours={calc.backupHours} />
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Contact &amp; property</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {[
                  { icon: MailIcon, v: c.email },
                  { icon: PhoneIcon, v: c.phone },
                  { icon: MapPinIcon, v: `${c.address}, ${c.city}` },
                  { icon: Building2Icon, v: `${c.propertyType} · ${c.systemKva} kVA estimated` },
                ].map((x) => (
                  <p key={x.v} className="flex items-start gap-2.5">
                    <x.icon className="mt-0.5 size-4 shrink-0 text-gold-text" />
                    <span>{x.v}</span>
                  </p>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="quote">
          {rep ? (
            <QuoteBuilder existing={quote} customer={c} rep={rep} calculation={calc} />
          ) : (
            <EmptyState icon={CalendarDaysIcon} title="Assign an advisor first" description="Quotes are prepared by the customer's advisor." />
          )}
        </TabsContent>

        <TabsContent value="media" className="space-y-10">
          <section>
            <h2 className="mb-3 font-display text-sm font-bold tracking-[0.12em] uppercase">Customer uploads</h2>
            <MediaManager initial={siteMedia} uploaderId={rep?.id ?? "admin"} kind="site" title="" description="" canUpload={false} />
          </section>
          <section>
            <h2 className="mb-3 font-display text-sm font-bold tracking-[0.12em] uppercase">Progress photos</h2>
            <MediaManager
              initial={progressMedia}
              uploaderId={rep?.id ?? "admin"}
              kind="progress"
              title="Upload progress photos"
              description="Share survey and installation photos with the customer. Pick the stage they belong to."
            />
          </section>
        </TabsContent>

        <TabsContent value="calls">
          {calls.length === 0 ? (
            <EmptyState icon={VideoIcon} title="No calls yet" description="Calls booked by the customer will show here." />
          ) : (
            <ul className="divide-y rounded-2xl border bg-card">
              {calls.map((b) => (
                <li key={b.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                  <span className="grid size-10 place-items-center rounded-xl bg-gold-soft text-gold-text">
                    <VideoIcon className="size-4" />
                  </span>
                  <div className="flex-1">
                    <p className="font-medium">{formatDateTime(b.startsAt)}</p>
                    <p className="text-sm text-muted-foreground">{b.topic}</p>
                  </div>
                  <span className="text-xs text-muted-foreground capitalize">{b.status}</span>
                  {b.status === "booked" && <StartCallButton peer={c.name} label="Start call" size="sm" />}
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
