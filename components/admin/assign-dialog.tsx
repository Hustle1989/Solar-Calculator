"use client";

import { useState } from "react";
import { Loader2Icon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { UserAvatar, EmptyState } from "@/components/shared/ui-bits";
import { goldButton } from "@/components/shared/styles";
import { UsersIcon } from "lucide-react";

export type RepOption = { id: string; name: string; open: number };

export function AssignDialog({
  open,
  onOpenChange,
  customerName,
  currentRepId,
  reps,
  onAssign,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  customerName: string;
  currentRepId?: string | null;
  reps: RepOption[];
  onAssign: (repId: string) => Promise<void> | void;
}) {
  const leastBusy = [...reps].sort((a, b) => a.open - b.open)[0];
  const [repId, setRepId] = useState<string>(currentRepId ?? leastBusy?.id ?? "");
  const [busy, setBusy] = useState(false);

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {currentRepId ? "Reassign" : "Assign"} {customerName}
          </DialogTitle>
          <DialogDescription>Their dashboard updates instantly, and a private chat opens between them.</DialogDescription>
        </DialogHeader>
        {reps.length === 0 ? (
          <EmptyState icon={UsersIcon} title="No active advisors" description="Invite an advisor first, then assign customers to them." />
        ) : (
          <RadioGroup value={repId} onValueChange={setRepId} className="max-h-80 gap-2 overflow-y-auto">
            {reps.map((r) => (
              <label
                key={r.id}
                htmlFor={`rep-${r.id}`}
                className={cn("flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition", repId === r.id && "border-gold bg-gold-soft")}
              >
                <RadioGroupItem id={`rep-${r.id}`} value={r.id} />
                <UserAvatar name={r.name} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    {r.name}
                    {r.id === leastBusy?.id && <span className="rounded bg-emerald-500/15 px-1.5 text-[0.65rem] text-emerald-600 dark:text-emerald-300">Least busy</span>}
                    {r.id === currentRepId && <span className="rounded bg-muted px-1.5 text-[0.65rem]">Current</span>}
                  </span>
                  <span className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <Progress value={Math.min(100, r.open * 20)} className="h-1.5 w-20" /> {r.open} open customers
                  </span>
                </span>
              </label>
            ))}
          </RadioGroup>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button
            className={goldButton}
            disabled={!repId || repId === currentRepId || busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onAssign(repId);
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy && <Loader2Icon className="animate-spin" />}
            {currentRepId ? "Reassign" : "Assign advisor"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
