import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, CalendarCheckIcon, ShieldCheckIcon, WrenchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/ui-bits";
import { QuoteDocument } from "@/components/quotes/quote-document";
import { QuoteActions } from "@/components/quotes/quote-actions";
import { getCustomer, getRep, quotes, quoteTotals } from "@/lib/mock-data";

export const metadata: Metadata = { title: "Your quote" };

export default async function QuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quote = quotes.find((q) => q.id === id);
  if (!quote) notFound();
  const customer = getCustomer(quote.customerId)!;
  const rep = getRep(quote.repId)!;
  const t = quoteTotals(quote);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/dashboard">
          <ArrowLeftIcon /> My project
        </Link>
      </Button>
      <PageHeader eyebrow="Quote" title={`Your solar system quote`} description={`Prepared by ${rep.name}. Review it, ask questions, then accept to book your installation.`} />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <QuoteDocument quote={quote} customer={customer} rep={rep} />
        <div className="space-y-4 lg:sticky lg:top-24">
          <QuoteActions quoteNumber={quote.number} depositKobo={t.deposit} email={customer.email} />
          <ul className="space-y-3 rounded-2xl border bg-card p-5 text-sm">
            {[
              { icon: CalendarCheckIcon, t: "Site survey within 5 working days of your deposit" },
              { icon: WrenchIcon, t: "Installation in 1–2 days by certified engineers" },
              { icon: ShieldCheckIcon, t: "25-yr panel · 10-yr battery · 12-month workmanship warranty" },
            ].map((x) => (
              <li key={x.t} className="flex gap-3">
                <x.icon className="mt-0.5 size-4 shrink-0 text-gold-text" />
                <span className="text-muted-foreground">{x.t}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
