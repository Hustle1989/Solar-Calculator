"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2Icon, DownloadIcon, Loader2Icon, LockIcon, MessageSquareIcon, ShieldCheckIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { naira } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { goldButton } from "@/components/shared/styles";

type Step = "review" | "redirect" | "processing" | "done";

/** Accept + pay deposit. Payment is simulated; Paystack is wired in Phase 3. */
export function QuoteActions({ quoteNumber, depositKobo, email }: { quoteNumber: string; depositKobo: number; email: string }) {
  const [status, setStatus] = useState<"sent" | "paid">("sent");
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("review");
  const [agreed, setAgreed] = useState(false);
  const reference = `dep_${quoteNumber.toLowerCase()}_8f3k2`;

  const pay = () => {
    setStep("processing");
    setTimeout(() => {
      setStep("done");
      setStatus("paid");
    }, 1800);
  };

  return (
    <div className="space-y-4">
      {status === "paid" ? (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
          <div className="flex items-center gap-2 font-semibold text-emerald-700 dark:text-emerald-300">
            <CheckCircle2Icon className="size-5" /> Deposit paid
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {naira(depositKobo)} received · Ref {reference}. Your advisor will schedule the site survey.
          </p>
        </div>
      ) : (
        <div className="gold-border rounded-2xl p-5">
          <p className="text-sm text-muted-foreground">Deposit to book installation</p>
          <p className="font-display text-3xl font-extrabold text-gold-gradient">{naira(depositKobo)}</p>
          <Button
            className={cn(goldButton, "mt-4 h-11 w-full text-base")}
            onClick={() => {
              setStep("review");
              setAgreed(false);
              setOpen(true);
            }}
          >
            Accept quote &amp; pay deposit
          </Button>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <LockIcon className="size-3" /> Secured by Paystack · Card, transfer or USSD
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Button asChild variant="outline">
          <Link href="/dashboard/chat">
            <MessageSquareIcon /> Ask a question
          </Link>
        </Button>
        <Button variant="outline" onClick={() => toast("PDF download", { description: "Quote PDFs will be generated once the backend is connected." })}>
          <DownloadIcon /> Download PDF
        </Button>
      </div>

      <Dialog open={open} onOpenChange={(o) => step !== "processing" && setOpen(o)}>
        <DialogContent className="sm:max-w-md" showCloseButton={step !== "processing"}>
          {step === "review" && (
            <>
              <DialogHeader>
                <DialogTitle>Accept quote {quoteNumber}</DialogTitle>
                <DialogDescription>Accepting locks the quote. You&apos;ll then pay the deposit securely through Paystack.</DialogDescription>
              </DialogHeader>
              <div className="rounded-xl bg-muted/60 p-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Deposit due now</span>
                  <span className="font-semibold">{naira(depositKobo)}</span>
                </div>
                <div className="mt-1 flex justify-between">
                  <span className="text-muted-foreground">Receipt sent to</span>
                  <span>{email}</span>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Checkbox id="agree" checked={agreed} onCheckedChange={(v) => setAgreed(v === true)} className="mt-0.5" />
                <Label htmlFor="agree" className="text-sm leading-snug font-normal text-muted-foreground">
                  I accept this quote and the installation terms. The deposit is refundable if the site survey shows the
                  system can&apos;t be installed.
                </Label>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button className={goldButton} disabled={!agreed} onClick={() => setStep("redirect")}>
                  Accept &amp; continue
                </Button>
              </DialogFooter>
            </>
          )}
          {step === "redirect" && (
            <>
              <DialogHeader>
                <DialogTitle>Pay with Paystack</DialogTitle>
                <DialogDescription>Demo checkout. No real payment is taken in this preview.</DialogDescription>
              </DialogHeader>
              <div className="rounded-xl border p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">{quoteNumber} deposit</span>
                  <span className="font-display text-lg font-bold">{naira(depositKobo)}</span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                  {["Card", "Bank transfer", "USSD"].map((m, i) => (
                    <div key={m} className={cn("rounded-lg border px-2 py-2.5 text-center", i === 0 && "border-gold bg-gold-soft text-gold-text")}>
                      {m}
                    </div>
                  ))}
                </div>
              </div>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheckIcon className="size-3.5" /> Your card details go straight to Paystack. We never see or store them.
              </p>
              <DialogFooter>
                <Button variant="outline" onClick={() => setStep("review")}>Back</Button>
                <Button className={goldButton} onClick={pay}>
                  Pay {naira(depositKobo)}
                </Button>
              </DialogFooter>
            </>
          )}
          {step === "processing" && (
            <div className="flex flex-col items-center py-8 text-center">
              <Loader2Icon className="size-10 animate-spin text-gold-text" />
              <DialogTitle className="mt-4">Confirming your payment…</DialogTitle>
              <DialogDescription className="mt-1">Waiting for confirmation from Paystack. Please don&apos;t close this window.</DialogDescription>
            </div>
          )}
          {step === "done" && (
            <div className="flex flex-col items-center py-6 text-center">
              <span className="grid size-16 place-items-center rounded-full bg-emerald-500/15 text-emerald-500">
                <CheckCircle2Icon className="size-9" />
              </span>
              <DialogTitle className="mt-4 font-display text-xl">Deposit received!</DialogTitle>
              <DialogDescription className="mt-1">
                {naira(depositKobo)} paid · Ref {reference}. A receipt is on its way to {email}.
              </DialogDescription>
              <div className="mt-6 flex w-full flex-col gap-2 sm:flex-row">
                <Button asChild className={cn(goldButton, "flex-1")}>
                  <Link href="/dashboard">Back to my project</Link>
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
                  View quote
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
