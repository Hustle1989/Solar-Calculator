"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { InboxIcon } from "lucide-react";
import { toast } from "sonner";
import type { SealedLiveQuery } from "@neon/realtime/client";
import { naira, timeAgo } from "@/lib/format";
import { assignAdvisor } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { EmptyState, UserAvatar } from "@/components/shared/ui-bits";
import { useLive } from "@/components/realtime/realtime-root";
import { LiveDot } from "@/components/customer/live-status";
import { AssignDialog, type RepOption } from "./assign-dialog";

export type QueueRow = {
  user_id: string;
  name: string;
  email: string;
  city: string | null;
  property_type: string | null;
  created_at: Date | string;
  system_kva: string | null;
  estimate_kobo: string | null;
};

/** Customers waiting for an advisor. Live: new sign-ups appear, assigned ones drop out, without a refresh. */
export function UnassignedQueue({
  userId,
  sealedQuery,
  initialData,
  reps,
}: {
  userId: string;
  sealedQuery: SealedLiveQuery<QueueRow>;
  initialData: QueueRow[];
  reps: RepOption[];
}) {
  const router = useRouter();
  const { rows: liveRows, status } = useLive("admin-queue", userId, sealedQuery, initialData);
  const [hidden, setHidden] = useState<Set<string>>(new Set()); // optimistic: hide while the change syncs
  const [assigning, setAssigning] = useState<QueueRow | null>(null);
  const rows = liveRows.filter((r) => !hidden.has(r.user_id));

  return (
    <div className="rounded-2xl border bg-card">
      <div className="flex items-center gap-3 border-b px-5 py-4">
        <p className="font-semibold">Waiting for an advisor</p>
        <span className="rounded-full bg-gold-gradient px-2 text-xs font-bold text-black tabular-nums">{rows.length}</span>
        <span className="ml-auto">
          <LiveDot status={status} />
        </span>
      </div>
      {rows.length === 0 ? (
        <EmptyState icon={InboxIcon} title="All caught up" description="Every customer has an advisor. New sign-ups appear here instantly." className="m-4 border-0" />
      ) : (
        <ul className="divide-y">
          {rows.map((c) => (
            <li key={c.user_id} className="flex animate-in flex-col gap-3 px-5 py-4 fade-in slide-in-from-top-1 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <UserAvatar name={c.name} />
                <div className="min-w-0">
                  <p className="truncate font-medium">{c.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {[c.property_type, c.city, c.system_kva ? `${c.system_kva} kVA` : null, c.estimate_kobo ? naira(Number(c.estimate_kobo)) : null].filter(Boolean).join(" · ") || c.email}
                  </p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground" suppressHydrationWarning>
                Signed up {timeAgo(new Date(c.created_at))}
              </span>
              <Button size="sm" className="bg-gold-gradient text-black hover:brightness-110" onClick={() => setAssigning(c)}>
                Assign advisor
              </Button>
            </li>
          ))}
        </ul>
      )}
      {assigning && (
        <AssignDialog
          open
          onOpenChange={(o) => !o && setAssigning(null)}
          customerName={assigning.name}
          reps={reps}
          onAssign={async (repId) => {
            const res = await assignAdvisor({ customerId: assigning.user_id, repId });
            if (!res.ok) {
              toast.error(res.error);
              return;
            }
            setHidden((h) => new Set(h).add(assigning.user_id));
            toast.success(`${assigning.name} → ${reps.find((r) => r.id === repId)?.name}`, { description: "Their dashboard updated live." });
            setAssigning(null);
            router.refresh(); // refreshes the stats and pipeline around the queue
          }}
        />
      )}
    </div>
  );
}
