"use client";

import { useState } from "react";
import { CalculatorIcon, EyeIcon, PlusIcon, SendIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDate, kobo, naira } from "@/lib/format";
import { sizeSystem, type ApplianceLine } from "@/lib/calc/size-system";
import { equipment, quoteTotals, settings, type Customer, type Quote, type QuoteItem, type Rep } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { goldButton } from "@/components/shared/styles";
import { QuoteDocument } from "./quote-document";

let n = 0;
const rid = () => `qi-new-${++n}`;

function itemsFromCalculation(lines: ApplianceLine[], backupHours: number): QuoteItem[] {
  const r = sizeSystem(lines, backupHours, settings, equipment);
  const out: QuoteItem[] = [];
  if (r.panel && r.panels) out.push({ id: rid(), description: `${r.panel.name} solar panel`, qty: r.panels, unitKobo: r.panel.priceKobo });
  if (r.battery && r.batteryUnits) out.push({ id: rid(), description: `${r.battery.name} battery`, qty: r.batteryUnits, unitKobo: r.battery.priceKobo });
  if (r.inverter) out.push({ id: rid(), description: r.inverter.name, qty: 1, unitKobo: r.inverter.priceKobo });
  out.push({ id: rid(), description: "Cabling, breakers & surge protection", qty: 1, unitKobo: r.cost.accessories });
  return out;
}

export function QuoteBuilder({
  existing,
  customer,
  rep,
  calculation,
}: {
  existing?: Quote;
  customer: Customer;
  rep: Rep;
  calculation: { lines: ApplianceLine[]; backupHours: number };
}) {
  const [items, setItems] = useState<QuoteItem[]>(existing?.items ?? itemsFromCalculation(calculation.lines, calculation.backupHours));
  const [installPercent, setInstallPercent] = useState((existing?.installPercent ?? settings.installPercent) * 100);
  const [note, setNote] = useState(existing?.note ?? "Includes site survey, installation and commissioning.");
  const [status, setStatus] = useState(existing?.status ?? "draft");
  const [preview, setPreview] = useState(false);
  const locked = status === "accepted" || status === "deposit_paid";

  const draft: Quote = {
    id: existing?.id ?? "draft",
    number: existing?.number ?? "Q-DRAFT",
    customerId: customer.id,
    repId: rep.id,
    status,
    items,
    installPercent: installPercent / 100,
    depositPercent: settings.depositPercent,
    createdAt: existing?.createdAt ?? new Date(),
    validUntil: existing?.validUntil ?? new Date(Date.now() + 14 * 86_400_000),
    note,
  };
  const t = quoteTotals(draft);
  const edit = (id: string, patch: Partial<QuoteItem>) => setItems((is) => is.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="rounded-2xl border bg-card">
        <div className="flex flex-wrap items-center gap-3 border-b p-4">
          <p className="font-semibold">{draft.number}</p>
          <Badge variant="outline" className={cn(status === "sent" && "border-gold/40 bg-gold-soft text-gold-text")}>
            {status === "sent" ? "Sent · awaiting customer" : status === "draft" ? "Draft" : status}
          </Badge>
          {!locked && (
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto"
              onClick={() => {
                setItems(itemsFromCalculation(calculation.lines, calculation.backupHours));
                toast("Rebuilt from the customer's calculation");
              }}
            >
              <CalculatorIcon /> Rebuild from calculation
            </Button>
          )}
        </div>

        <div className="divide-y">
          <div className="hidden grid-cols-[minmax(0,1fr)_80px_140px_120px_36px] gap-3 px-4 py-2 text-xs font-medium tracking-wide text-muted-foreground uppercase md:grid">
            <span>Item</span>
            <span>Qty</span>
            <span>Unit price (₦)</span>
            <span className="text-right">Amount</span>
            <span />
          </div>
          {items.map((i) => (
            <div key={i.id} className="grid grid-cols-[1fr_auto] gap-2 p-3 md:grid-cols-[minmax(0,1fr)_80px_140px_120px_36px] md:items-center md:gap-3 md:px-4">
              <Input value={i.description} disabled={locked} onChange={(e) => edit(i.id, { description: e.target.value })} aria-label="Item description" className="col-span-2 md:col-span-1" />
              <Input type="number" min={1} value={i.qty} disabled={locked} onChange={(e) => edit(i.id, { qty: Math.max(1, Number(e.target.value)) })} aria-label="Quantity" className="tabular-nums" />
              <Input
                type="number"
                min={0}
                value={i.unitKobo / 100}
                disabled={locked}
                onChange={(e) => edit(i.id, { unitKobo: kobo(Math.max(0, Number(e.target.value))) })}
                aria-label="Unit price in naira"
                className="tabular-nums"
              />
              <p className="text-right text-sm font-medium tabular-nums">{naira(i.qty * i.unitKobo)}</p>
              <Button variant="ghost" size="icon-sm" disabled={locked} onClick={() => setItems((is) => is.filter((x) => x.id !== i.id))} aria-label="Remove item">
                <Trash2Icon className="text-muted-foreground" />
              </Button>
            </div>
          ))}
        </div>
        {!locked && (
          <div className="border-t p-3">
            <Button variant="ghost" size="sm" onClick={() => setItems((is) => [...is, { id: rid(), description: "", qty: 1, unitKobo: 0 }])}>
              <PlusIcon /> Add line item
            </Button>
          </div>
        )}
        <div className="space-y-2 border-t p-4">
          <Label htmlFor="quote-note">Note to customer</Label>
          <Textarea id="quote-note" value={note} disabled={locked} onChange={(e) => setNote(e.target.value)} />
        </div>
      </div>

      <aside className="gold-border space-y-4 rounded-2xl p-5 xl:sticky xl:top-24">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="tabular-nums">{naira(t.subtotal)}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Installation</span>
            <span className="flex items-center gap-1">
              <Input type="number" min={0} max={50} value={installPercent} disabled={locked} onChange={(e) => setInstallPercent(Number(e.target.value))} className="h-7 w-16 text-right tabular-nums" aria-label="Installation percent" />%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground" />
            <span className="tabular-nums">{naira(t.installation)}</span>
          </div>
          <div className="flex justify-between border-t pt-2 font-display text-lg font-bold">
            <span>Total</span>
            <span className="tabular-nums">{naira(t.total)}</span>
          </div>
          <div className="flex justify-between rounded-lg bg-gold-soft px-3 py-2 text-gold-text">
            <span>Deposit ({settings.depositPercent}%)</span>
            <span className="font-semibold tabular-nums">{naira(t.deposit)}</span>
          </div>
          <p className="text-xs text-muted-foreground">Valid until {formatDate(draft.validUntil)}. Deposit % is set by admin.</p>
        </div>
        <Button variant="outline" className="w-full" onClick={() => setPreview(true)}>
          <EyeIcon /> Preview as customer
        </Button>
        {!locked && (
          <>
            <Button
              className={cn(goldButton, "w-full")}
              disabled={items.length === 0 || t.total === 0}
              onClick={() => {
                setStatus("sent");
                toast.success(status === "sent" ? "Updated quote sent" : "Quote sent", { description: `${customer.name} has been emailed and can accept it from their dashboard.` });
              }}
            >
              <SendIcon /> {status === "sent" ? "Send updated quote" : "Send quote"}
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => toast("Draft saved")}>
              Save draft
            </Button>
          </>
        )}
        {status === "sent" && <p className="text-center text-xs text-muted-foreground">Sending an updated quote replaces the previous one.</p>}
      </aside>

      <Dialog open={preview} onOpenChange={setPreview}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Customer preview</DialogTitle>
            <DialogDescription>This is exactly what {customer.name.split(" ")[0]} will see.</DialogDescription>
          </DialogHeader>
          <QuoteDocument quote={draft} customer={customer} rep={rep} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
