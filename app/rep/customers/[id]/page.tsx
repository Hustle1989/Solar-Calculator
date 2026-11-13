import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, Building2Icon, CalculatorIcon, MailIcon, MapPinIcon, MessageSquareIcon, PhoneIcon, VideoIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StageBadge } from "@/components/shared/stage";
import { EmptyState, UserAvatar } from "@/components/shared/ui-bits";
import { PreviewNotice } from "@/components/shared/preview-notice";
import { SystemSummary } from "@/components/shared/system-summary";
import { StartCallButton } from "@/components/call/start-call-button";
import { StageControl } from "@/components/rep/stage-control";
import { QuoteBuilder } from "@/components/quotes/quote-builder";
import { MediaManager } from "@/components/media/media-manager";
import { formatDate } from "@/lib/format";
import { canAccessCustomer, requireViewer } from "@/lib/auth/viewer";
import { getCustomerRecord, toCustomer } from "@/lib/data";
import type { Rep } from "@/lib/mock-data";

export const metadata: Metadata = { title: "Customer" };

export default async function RepCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewer = await requireViewer(["rep", "admin"], `/rep/customers/${id}`);
  const record = await getCustomerRecord(decodeURIComponent(id));
  // Not found and not yours look the same, so record ids can't be probed.
  if (!record || !canAccessCustomer(viewer, record.profile)) notFound();
  const { profile: p, rep, calc, events } = record;
  const customer = toCustomer(p, calc);
  const repForQuote: Rep | null = rep
    ? { id: rep.user_id, name: rep.name, email: rep.email, phone: rep.phone ?? "", title: rep.title ?? "Solar Advisor", status: "active", online: false, joined: rep.created_at }
    : null;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href={viewer.profile.role === "admin" ? "/admin/customers" : "/rep"}>
          <ArrowLeftIcon /> {viewer.profile.role === "admin" ? "All customers" : "My customers"}
        </Link>
      </Button>

      <div className="flex flex-col gap-5 rounded-2xl border bg-card p-5 sm:p-6 lg:flex-row lg:items-center">
        <div className="flex items-center gap-4">
          <UserAvatar name={p.name} size="lg" className="size-14" gold />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-extrabold tracking-tight">{p.name}</h1>
              <StageBadge stage={p.stage} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Customer since {formatDate(p.created_at)} · {rep ? `Advisor: ${rep.name}` : "No advisor yet"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 lg:ml-auto">
          <Button asChild variant="outline">
            <Link href="/rep/chat">
              <MessageSquareIcon /> Message
            </Link>
          </Button>
          <StartCallButton peer={p.name} />
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
                  <CardDescription>Advance the customer as work progresses. Their dashboard updates live.</CardDescription>
                </CardHeader>
                <CardContent>
                  <StageControl
                    key={p.stage}
                    customerId={p.user_id}
                    initialStage={p.stage}
                    events={events.map((e) => ({ stage: e.to_stage, at: e.created_at, by: e.changed_by ?? "System", note: e.note ?? undefined }))}
                    repName={viewer.profile.name}
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Saved calculation</CardTitle>
                  <CardDescription>{calc ? `From the load calculator on ${formatDate(calc.created_at)}` : "No calculation saved yet"}</CardDescription>
                </CardHeader>
                <CardContent>
                  {calc ? (
                    <SystemSummary lines={calc.lines} backupHours={calc.backup_hours} summary={calc.result} />
                  ) : (
                    <EmptyState icon={CalculatorIcon} title="No calculation yet" description="Ask the customer to use the load calculator, or build the quote from scratch." />
                  )}
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Contact &amp; property</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {[
                  { icon: MailIcon, v: p.email },
                  { icon: PhoneIcon, v: p.phone || "No phone number" },
                  { icon: MapPinIcon, v: [p.address, p.city].filter(Boolean).join(", ") || "No address yet" },
                  { icon: Building2Icon, v: `${p.property_type ?? "Property type not set"}${calc?.result.inverterKva ? ` · ${calc.result.inverterKva} kVA estimated` : ""}` },
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

        <TabsContent value="quote" className="space-y-4">
          <PreviewNotice>Quotes are saved and sent to customers in Phase 3, together with Paystack deposits. This builder works but isn&apos;t saved yet.</PreviewNotice>
          {repForQuote && calc ? (
            <QuoteBuilder customer={customer} rep={repForQuote} calculation={{ lines: calc.lines, backupHours: calc.backup_hours }} />
          ) : (
            <EmptyState icon={CalculatorIcon} title={rep ? "No calculation yet" : "Assign an advisor first"} description="A quote starts from the customer's saved calculation and their advisor." />
          )}
        </TabsContent>

        <TabsContent value="media" className="space-y-10">
          <PreviewNotice>Photo and video uploads connect to ImageKit in Phase 4.</PreviewNotice>
          <section>
            <h2 className="mb-3 font-display text-sm font-bold tracking-[0.12em] uppercase">Customer uploads</h2>
            <MediaManager initial={[]} uploaderId={viewer.userId} kind="site" title="" description="" canUpload={false} />
          </section>
          <section>
            <h2 className="mb-3 font-display text-sm font-bold tracking-[0.12em] uppercase">Progress photos</h2>
            <MediaManager initial={[]} uploaderId={viewer.userId} kind="progress" title="Upload progress photos" description="Share survey and installation photos with the customer. Pick the stage they belong to." />
          </section>
        </TabsContent>

        <TabsContent value="calls">
          <EmptyState icon={VideoIcon} title="No calls yet" description="Calls this customer books will show here once booking is connected (Phase 4)." />
        </TabsContent>
      </Tabs>
    </div>
  );
}
