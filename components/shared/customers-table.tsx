"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRightIcon, MessageSquareIcon, MoreHorizontalIcon, SearchIcon, UsersIcon } from "lucide-react";
import { toast } from "sonner";
import { formatDate, naira, timeAgo } from "@/lib/format";
import type { Customer } from "@/lib/mock-data";
import type { Stage } from "@/lib/stages";
import { assignAdvisor, setAccountActive } from "@/lib/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StageBadge } from "@/components/shared/stage";
import { EmptyState, UserAvatar } from "@/components/shared/ui-bits";
import { AssignDialog, type RepOption } from "@/components/admin/assign-dialog";

const FILTERS: Record<string, { label: string; stages: Stage[] }> = {
  all: { label: "All", stages: [] },
  unassigned: { label: "Unassigned", stages: ["new"] },
  quote: { label: "Needs quote", stages: ["assigned"] },
  payment: { label: "Awaiting deposit", stages: ["quote_sent"] },
  delivery: { label: "In delivery", stages: ["deposit_paid", "site_survey", "installation"] },
  done: { label: "Completed", stages: ["completed"] },
};

export function CustomersTable({ rows: initial, admin = false, reps = [] }: { rows: Customer[]; admin?: boolean; reps?: RepOption[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  // Take fresh rows whenever the server re-renders (after an action or router.refresh()).
  const [prevInitial, setPrevInitial] = useState(initial);
  if (initial !== prevInitial) {
    setPrevInitial(initial);
    setRows(initial);
  }
  const repName = (id: string | null) => reps.find((r) => r.id === id)?.name;
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [assigning, setAssigning] = useState<Customer | null>(null);

  const filters = Object.entries(FILTERS).filter(([k]) => admin || k !== "unassigned");
  const visible = useMemo(() => {
    const f = FILTERS[filter];
    return rows.filter(
      (c) =>
        (f.stages.length === 0 || f.stages.includes(c.stage)) &&
        `${c.name} ${c.city} ${c.email}`.toLowerCase().includes(q.toLowerCase()),
    );
  }, [rows, filter, q]);

  return (
    <div className="rounded-2xl border bg-card">
      <div className="flex flex-col gap-3 border-b p-4 2xl:flex-row 2xl:items-center 2xl:justify-between">
        <Tabs value={filter} onValueChange={setFilter} className="min-w-0">
          <TabsList className="max-w-full justify-start overflow-x-auto">
            {filters.map(([k, f]) => (
              <TabsTrigger key={k} value={k} className="px-3">
                {f.label}
                <span className="ml-1 text-xs text-muted-foreground tabular-nums">
                  {f.stages.length ? rows.filter((c) => f.stages.includes(c.stage)).length : rows.length}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative sm:max-w-xs 2xl:w-72">
          <SearchIcon className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, city or email" className="pl-8" aria-label="Search customers" />
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState icon={UsersIcon} title="No customers match" description="Try a different filter or search." className="m-4 border-0" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Customer</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead className="hidden md:table-cell">System</TableHead>
              {admin && <TableHead className="hidden lg:table-cell">Advisor</TableHead>}
              <TableHead className="hidden sm:table-cell">Last activity</TableHead>
              <TableHead className="w-12 pr-4" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((c) => {
              const rep = c.repId ? { name: repName(c.repId) ?? "Advisor" } : null;
              return (
                <TableRow key={c.id} className="cursor-pointer" onClick={() => router.push(`/rep/customers/${c.id}`)}>
                  <TableCell className="pl-4">
                    <div className="flex items-center gap-3">
                      <UserAvatar name={c.name} />
                      <div className="min-w-0">
                        <p className="font-medium">{c.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {c.propertyType} · {c.city}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StageBadge stage={c.stage} />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <p className="font-medium">{c.systemKva} kVA</p>
                    <p className="text-xs text-muted-foreground">{naira(c.estimateKobo)}</p>
                  </TableCell>
                  {admin && (
                    <TableCell className="hidden lg:table-cell">
                      {rep ? (
                        <span className="text-sm">{rep.name}</span>
                      ) : (
                        <Button
                          size="xs"
                          className="bg-gold-gradient text-black"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAssigning(c);
                          }}
                        >
                          Assign
                        </Button>
                      )}
                    </TableCell>
                  )}
                  <TableCell className="hidden text-sm text-muted-foreground sm:table-cell" title={formatDate(c.lastActivity)}>
                    {timeAgo(c.lastActivity)}
                  </TableCell>
                  <TableCell className="pr-4" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${c.name}`}>
                          <MoreHorizontalIcon />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/rep/customers/${c.id}`}>
                            <ChevronRightIcon /> Open record
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/rep/chat">
                            <MessageSquareIcon /> Message
                          </Link>
                        </DropdownMenuItem>
                        {admin && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => setAssigning(c)}>{c.repId ? "Reassign advisor" : "Assign advisor"}</DropdownMenuItem>
                            <DropdownMenuItem
                              variant="destructive"
                              onSelect={async () => {
                                const res = await setAccountActive({ userId: c.id, active: false });
                                if (res.ok) {
                                  toast("Account deactivated", { description: `${c.name} can no longer use the app. Their history is kept.` });
                                  router.refresh();
                                } else toast.error(res.error);
                              }}
                            >
                              Deactivate account
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      {assigning && (
        <AssignDialog
          open
          onOpenChange={(o) => !o && setAssigning(null)}
          customerName={assigning.name}
          currentRepId={assigning.repId}
          reps={reps}
          onAssign={async (repId) => {
            const res = await assignAdvisor({ customerId: assigning.id, repId });
            if (!res.ok) {
              toast.error(res.error);
              return;
            }
            setRows((rs) => rs.map((r) => (r.id === assigning.id ? { ...r, repId, stage: r.stage === "new" ? "assigned" : r.stage } : r)));
            toast.success(`${assigning.name} assigned to ${repName(repId)}`, { description: "Their dashboard updated live." });
            setAssigning(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
