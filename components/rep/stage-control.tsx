"use client";

import { useState } from "react";
import { ArrowRightIcon, BanknoteIcon, CheckCircle2Icon, InfoIcon } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/format";
import { REP_NEXT_STAGE, STAGES, stageIndex, stageLabel, type Stage } from "@/lib/stages";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StageTracker } from "@/components/shared/stage";
import { goldButton } from "@/components/shared/styles";
import { advanceStage } from "@/lib/actions";
import { useRouter } from "next/navigation";

type Event = { stage: Stage; at: Date; by: string; note?: string };

export function StageControl({
  customerId,
  initialStage,
  events: initialEvents,
  repName,
}: {
  customerId: string;
  initialStage: Stage;
  events: Event[];
  repName: string;
}) {
  const router = useRouter();
  const [stage, setStage] = useState(initialStage);
  const [events, setEvents] = useState(initialEvents);
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [balancePaid, setBalancePaid] = useState(false);
  const next = REP_NEXT_STAGE[stage];

  const advance = async () => {
    if (!next) return;
    setBusy(true);
    const res = await advanceStage({ customerId, to: next, note: note || undefined });
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setStage(next);
    setEvents((e) => [...e, { stage: next, at: new Date(), by: repName, note: note || undefined }]);
    setOpen(false);
    setNote("");
    toast.success(`Moved to ${stageLabel(next)}`, { description: "The customer's dashboard updated live." });
    router.refresh();
  };

  return (
    <div className="space-y-6">
      <StageTracker stage={stage} />

      <div className="flex flex-col gap-3 rounded-xl bg-muted/50 p-4 sm:flex-row sm:items-center">
        <div className="flex-1 text-sm">
          <p className="font-medium">{STAGES[stageIndex(stage)].description}</p>
          {!next && stage !== "completed" && (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <InfoIcon className="size-3.5" />
              {stage === "quote_sent" ? "Moves to Deposit paid automatically when the customer pays." : "Send a quote to move this customer forward."}
            </p>
          )}
        </div>
        {next && (
          <Button className={goldButton} onClick={() => setOpen(true)}>
            Move to {stageLabel(next)} <ArrowRightIcon />
          </Button>
        )}
        {stageIndex(stage) >= stageIndex("installation") &&
          (balancePaid ? (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-300">
              <CheckCircle2Icon className="size-4" /> Balance paid
            </span>
          ) : (
            <Button
              variant="outline"
              onClick={() => {
                setBalancePaid(true);
                toast.success("Balance marked as paid (preview)", { description: "Saved with payments in Phase 3." });
              }}
            >
              <BanknoteIcon /> Mark balance paid
            </Button>
          ))}
      </div>

      <div>
        <p className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">History</p>
        <ol className="relative space-y-4 border-l pl-5">
          {[...events].reverse().map((e, i) => (
            <li key={`${e.stage}-${i}`} className="relative">
              <span className="absolute top-1 -left-[25px] size-3.5 rounded-full bg-gold-gradient ring-4 ring-card" />
              <p className="text-sm font-medium">{stageLabel(e.stage)}</p>
              <p className="text-xs text-muted-foreground">
                {e.note ? `${e.note} · ` : ""}
                {e.by} · {formatDate(e.at, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
              </p>
            </li>
          ))}
        </ol>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Move to {next ? stageLabel(next) : ""}?</DialogTitle>
            <DialogDescription>The customer sees this on their dashboard right away and gets an email.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="stage-note">Note for the customer (optional)</Label>
            <Textarea id="stage-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Survey booked for Thursday 10am" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button className={goldButton} onClick={advance} disabled={busy}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
