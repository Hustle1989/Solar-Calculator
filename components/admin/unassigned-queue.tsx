"use client";

import { useState } from "react";
import { InboxIcon, SparklesIcon } from "lucide-react";
import { toast } from "sonner";
import { naira, timeAgo } from "@/lib/format";
import { getRep, type Customer } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { EmptyState, UserAvatar } from "@/components/shared/ui-bits";
import { AssignDialog } from "./assign-dialog";

const NEW_SIGNUPS: Omit<Customer, "signedUp" | "lastActivity">[] = [
  { id: "c-2001", name: "Yetunde Alabi", email: "yetunde@example.com", phone: "", city: "Abeokuta", address: "", propertyType: "Home", stage: "new", repId: null, systemKva: 3.5, estimateKobo: 418_000_000 },
  { id: "c-2002", name: "Segun Martins", email: "segun@example.com", phone: "", city: "Lagos", address: "", propertyType: "Office", stage: "new", repId: null, systemKva: 7.5, estimateKobo: 1_100_000_000 },
];

export function UnassignedQueue({ initial }: { initial: Customer[] }) {
  const [rows, setRows] = useState(initial);
  const [assigning, setAssigning] = useState<Customer | null>(null);
  const [demoIdx, setDemoIdx] = useState(0);

  return (
    <div className="rounded-2xl border bg-card">
      <div className="flex items-center gap-3 border-b px-5 py-4">
        <p className="font-semibold">Waiting for an advisor</p>
        <span className="rounded-full bg-gold-gradient px-2 text-xs font-bold text-black tabular-nums">{rows.length}</span>
        <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          Live
        </span>
        {demoIdx < NEW_SIGNUPS.length && (
          <Button
            variant="ghost"
            size="xs"
            onClick={() => {
              const n = { ...NEW_SIGNUPS[demoIdx], signedUp: new Date(), lastActivity: new Date() };
              setRows((r) => [n, ...r]);
              setDemoIdx((i) => i + 1);
              toast(`New sign-up: ${n.name}`, { description: "Appeared live in your queue." });
            }}
          >
            <SparklesIcon /> Simulate sign-up
          </Button>
        )}
      </div>
      {rows.length === 0 ? (
        <EmptyState icon={InboxIcon} title="All caught up" description="Every customer has an advisor. New sign-ups appear here instantly." className="m-4 border-0" />
      ) : (
        <ul className="divide-y">
          {rows.map((c) => (
            <li key={c.id} className="flex flex-col gap-3 px-5 py-4 animate-in fade-in slide-in-from-top-1 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <UserAvatar name={c.name} />
                <div className="min-w-0">
                  <p className="truncate font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.propertyType} · {c.city} · {c.systemKva} kVA · {naira(c.estimateKobo)}
                  </p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">Signed up {timeAgo(c.signedUp)}</span>
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
          onAssign={(repId) => {
            setRows((r) => r.filter((x) => x.id !== assigning.id));
            toast.success(`${assigning.name} → ${getRep(repId)?.name}`, { description: "Introduction emails sent and their chat is open." });
            setAssigning(null);
          }}
        />
      )}
    </div>
  );
}
