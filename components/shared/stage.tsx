import { CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { STAGES, stageIndex, stageLabel, type Stage } from "@/lib/stages";
import { Badge } from "@/components/ui/badge";

const tone: Record<Stage, string> = {
  new: "bg-sky-500/12 text-sky-600 dark:text-sky-300 border-sky-500/25",
  assigned: "bg-violet-500/12 text-violet-600 dark:text-violet-300 border-violet-500/25",
  quote_sent: "bg-gold-soft text-gold-text border-gold/30",
  deposit_paid: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-300 border-emerald-500/25",
  site_survey: "bg-orange-500/12 text-orange-600 dark:text-orange-300 border-orange-500/25",
  installation: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  completed: "bg-emerald-600/15 text-emerald-700 dark:text-emerald-300 border-emerald-600/30",
};

export function StageBadge({ stage, className }: { stage: Stage; className?: string }) {
  return (
    <Badge variant="outline" className={cn("gap-1.5", tone[stage], className)}>
      <span className="size-1.5 rounded-full bg-current" />
      {stage === "new" ? "Unassigned" : stageLabel(stage)}
    </Badge>
  );
}

/** Horizontal on wide screens, vertical on phones. */
export function StageTracker({ stage, className }: { stage: Stage; className?: string }) {
  const current = stageIndex(stage);
  return (
    <ol className={cn("grid gap-4 sm:grid-cols-7 sm:gap-0", className)}>
      {STAGES.map((s, i) => {
        const done = i < current || stage === "completed";
        const active = i === current && stage !== "completed";
        return (
          <li key={s.id} className="relative flex items-center gap-3 sm:flex-col sm:items-center sm:gap-2 sm:text-center">
            {i > 0 && (
              <span
                aria-hidden
                className={cn(
                  "absolute top-[15px] right-1/2 hidden h-0.5 w-full sm:block",
                  i <= current ? "bg-gold-gradient" : "bg-border",
                )}
              />
            )}
            <span
              className={cn(
                "relative z-10 grid size-8 shrink-0 place-items-center rounded-full border text-xs font-semibold transition",
                done && "border-transparent bg-gold-gradient text-black",
                active && "border-gold bg-background text-gold-text ring-4 ring-gold/20",
                !done && !active && "border-border bg-background text-muted-foreground",
              )}
            >
              {done ? <CheckIcon className="size-4" /> : i + 1}
            </span>
            <span
              className={cn(
                "text-sm sm:text-xs sm:leading-tight",
                active ? "font-semibold text-foreground" : done ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {s.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
