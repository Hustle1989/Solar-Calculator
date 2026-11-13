import { LogoMark } from "@/components/brand/logo";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { brand } from "@/lib/brand";
import { formatDate, naira } from "@/lib/format";
import { quoteTotals, type Customer, type Quote, type Rep } from "@/lib/mock-data";

/** The quote as a document, shared by the customer quote page and the rep preview. */
export function QuoteDocument({ quote, customer, rep }: { quote: Quote; customer: Customer; rep: Rep }) {
  const t = quoteTotals(quote);
  return (
    <article className="overflow-hidden rounded-2xl border bg-card">
      <header className="dark relative bg-night p-6 text-foreground sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="flex items-center gap-3">
            <LogoMark className="size-11" />
            <div>
              <p className="font-display text-lg font-extrabold tracking-[0.18em] text-gold-gradient">{brand.wordmarkTop}</p>
              <p className="font-display text-[0.6rem] tracking-[0.4em] text-muted-foreground">{brand.wordmarkBottom}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-display text-xs tracking-[0.3em] text-gold-text uppercase">Quotation</p>
            <p className="font-display text-2xl font-extrabold">{quote.number}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Issued {formatDate(quote.createdAt)} · Valid until {formatDate(quote.validUntil)}
            </p>
          </div>
        </div>
        <div className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs tracking-wide text-muted-foreground uppercase">Prepared for</p>
            <p className="mt-1 font-semibold">{customer.name}</p>
            <p className="text-muted-foreground">
              {customer.address}, {customer.city}
            </p>
          </div>
          <div className="sm:text-right">
            <p className="text-xs tracking-wide text-muted-foreground uppercase">Your advisor</p>
            <p className="mt-1 font-semibold">{rep.name}</p>
            <p className="text-muted-foreground">{rep.email}</p>
          </div>
        </div>
      </header>
      <div className="gold-rule" />

      <div className="p-2 sm:p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="hidden text-right sm:table-cell">Unit price</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quote.items.map((i) => (
              <TableRow key={i.id}>
                <TableCell className="font-medium whitespace-normal">{i.description}</TableCell>
                <TableCell className="text-right tabular-nums">{i.qty}</TableCell>
                <TableCell className="hidden text-right tabular-nums sm:table-cell">{naira(i.unitKobo)}</TableCell>
                <TableCell className="text-right tabular-nums">{naira(i.qty * i.unitKobo)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter className="bg-transparent">
            <TableRow>
              <TableCell colSpan={2} className="text-muted-foreground sm:hidden">Subtotal</TableCell>
              <TableCell colSpan={3} className="hidden text-muted-foreground sm:table-cell">Subtotal</TableCell>
              <TableCell className="text-right tabular-nums">{naira(t.subtotal)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={2} className="text-muted-foreground sm:hidden">Installation ({quote.installPercent * 100}%)</TableCell>
              <TableCell colSpan={3} className="hidden text-muted-foreground sm:table-cell">Installation &amp; commissioning ({quote.installPercent * 100}%)</TableCell>
              <TableCell className="text-right tabular-nums">{naira(t.installation)}</TableCell>
            </TableRow>
            <TableRow className="text-base">
              <TableCell colSpan={2} className="font-display font-bold sm:hidden">Total</TableCell>
              <TableCell colSpan={3} className="hidden font-display font-bold sm:table-cell">Total</TableCell>
              <TableCell className="text-right font-display font-bold tabular-nums">{naira(t.total)}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      <div className="grid gap-4 border-t p-6 sm:grid-cols-2 sm:p-8">
        <div className="rounded-xl bg-gold-soft p-4 ring-1 ring-gold/30">
          <p className="text-xs tracking-wide text-gold-text uppercase">Deposit due now ({quote.depositPercent}%)</p>
          <p className="mt-1 font-display text-2xl font-extrabold text-gold-text">{naira(t.deposit)}</p>
          <p className="mt-1 text-xs text-muted-foreground">Balance of {naira(t.balance)} is due after installation.</p>
        </div>
        <div className="text-sm">
          <p className="text-xs tracking-wide text-muted-foreground uppercase">Notes</p>
          <p className="mt-1 leading-relaxed text-muted-foreground">{quote.note}</p>
        </div>
      </div>
    </article>
  );
}
