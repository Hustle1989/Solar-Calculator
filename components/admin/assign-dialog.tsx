"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { customers, reps } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { UserAvatar } from "@/components/shared/ui-bits";
import { goldButton } from "@/components/shared/styles";

export function AssignDialog({
  open,
  onOpenChange,
  customerName,
  currentRepId,
  onAssign,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  customerName: string;
  currentRepId?: string | null;
  onAssign: (repId: string) => void;
}) {
  const active = reps.filter((r) => r.status === "active");
  const load = (id: string) => customers.filter((c) => c.repId === id && c.stage !== "completed").length;
  const leastBusy = [...active].sort((a, b) => load(a.id) - load(b.id))[0];
  const [repId, setRepId] = useState<string>(currentRepId ?? leastBusy.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{currentRepId ? "Reassign" : "Assign"} {customerName}</DialogTitle>
          <DialogDescription>
            They&apos;ll get an email introducing their advisor, and a private chat opens between them.
          </DialogDescription>
        </DialogHeader>
        <RadioGroup value={repId} onValueChange={setRepId} className="gap-2">
          {active.map((r) => {
            const n = load(r.id);
            return (
              <label
                key={r.id}
                htmlFor={`rep-${r.id}`}
                className={cn("flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition", repId === r.id && "border-gold bg-gold-soft")}
              >
                <RadioGroupItem id={`rep-${r.id}`} value={r.id} />
                <UserAvatar name={r.name} online={r.online} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 text-sm font-medium">
                    {r.name}
                    {r.id === leastBusy.id && <span className="rounded bg-emerald-500/15 px-1.5 text-[0.65rem] text-emerald-600 dark:text-emerald-300">Least busy</span>}
                    {r.id === currentRepId && <span className="rounded bg-muted px-1.5 text-[0.65rem]">Current</span>}
                  </span>
                  <span className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <Progress value={Math.min(100, n * 20)} className="h-1.5 w-20" /> {n} open customers
                  </span>
                </span>
              </label>
            );
          })}
        </RadioGroup>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button className={goldButton} disabled={repId === currentRepId} onClick={() => onAssign(repId)}>
            {currentRepId ? "Reassign" : "Assign advisor"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
