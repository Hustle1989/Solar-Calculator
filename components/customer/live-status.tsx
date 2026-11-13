"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { SealedLiveQuery } from "@neon/realtime/client";
import { useLive } from "@/components/realtime/realtime-root";
import { StageBadge, StageTracker } from "@/components/shared/stage";
import { STAGES, stageIndex, type Stage } from "@/lib/stages";
import { cn } from "@/lib/utils";

export type CustomerStatusRow = { user_id: string; stage: string; assigned_rep_id: string | null; rep_name: string | null; rep_title: string | null };

export function LiveDot({ status }: { status?: string }) {
  const live = status === "live";
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground" title={live ? "Updates instantly" : "Connecting…"}>
      <span className="relative flex size-2">
        {live && <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />}
        <span className={cn("relative inline-flex size-2 rounded-full", live ? "bg-emerald-500" : "bg-amber-400")} />
      </span>
      {live ? "Live" : "Connecting"}
    </span>
  );
}

/**
 * The customer's project status, kept live with Neon Realtime. When the stage or advisor changes
 * (e.g. an admin assigns an advisor), the rest of the server-rendered page refreshes too.
 */
export function LiveProjectStatus({
  userId,
  sealedQuery,
  initialData,
  variant = "card",
}: {
  userId: string;
  sealedQuery: SealedLiveQuery<CustomerStatusRow>;
  initialData: CustomerStatusRow[];
  variant?: "card" | "tracker-only";
}) {
  const router = useRouter();
  const { rows, status } = useLive("customer-status", userId, sealedQuery, initialData);
  const row = rows[0] ?? initialData[0];
  const stage = (row?.stage ?? "new") as Stage;

  const first = useRef(initialData[0]);
  useEffect(() => {
    const was = first.current;
    if (!row || !was) return;
    if (row.stage !== was.stage || row.assigned_rep_id !== was.assigned_rep_id) {
      first.current = row;
      router.refresh();
    }
  }, [row, router]);

  if (variant === "tracker-only") {
    return (
      <div>
        <div className="mb-4 flex justify-end">
          <LiveDot status={status} />
        </div>
        <StageTracker stage={stage} />
      </div>
    );
  }

  return (
    <div className="gold-border rounded-xl p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="font-display text-lg font-medium">Project status</h2>
        <StageBadge stage={stage} />
        <span className="ml-auto">
          <LiveDot status={status} />
        </span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{STAGES[stageIndex(stage)]?.description}</p>
      <StageTracker stage={stage} className="mt-6" />
    </div>
  );
}
