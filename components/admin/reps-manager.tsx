"use client";

import { useState } from "react";
import { MailIcon, MoreHorizontalIcon, UserPlusIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import type { Rep } from "@/lib/mock-data";
import { setAccountActive } from "@/lib/actions";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/shared/ui-bits";
import { goldButton } from "@/components/shared/styles";

const STATUS: Record<Rep["status"], string> = {
  active: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  invited: "border-gold/40 bg-gold-soft text-gold-text",
  deactivated: "text-muted-foreground",
};

type RepRow = Rep & { open?: number };

export function RepsManager({ initial }: { initial: RepRow[] }) {
  const router = useRouter();
  const [rows, setRows] = useState<RepRow[]>(initial);
  const [prevInitial, setPrevInitial] = useState(initial);
  if (initial !== prevInitial) {
    setPrevInitial(initial);
    setRows(initial);
  }
  const setActive = async (r: RepRow, active: boolean) => {
    const res = await setAccountActive({ userId: r.id, active });
    if (!res.ok) return toast.error(res.error);
    setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, status: active ? "active" : "deactivated" } : x)));
    toast(active ? `${r.name} reactivated` : `${r.name} deactivated`, active ? undefined : { description: "Reassign their open customers from the Customers page." });
    router.refresh();
  };
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const valid = /^\S+@\S+\.\S+$/.test(email) && name.trim().length > 1;

  const invite = () => {
    setRows((r) => [...r, { id: `r-${Date.now()}`, name: name.trim(), email: email.trim(), phone: "", title: "Solar Advisor", status: "invited", online: false, joined: new Date() }]);
    toast.success("Invite added (preview)", { description: "Invite emails are sent once Resend is connected in Phase 2. For now, ask them to sign up and run `npm run db:set-role`." });
    setOpen(false);
    setEmail("");
    setName("");
  };

  return (
    <>
      <div className="flex justify-end">
        <Button className={goldButton} onClick={() => setOpen(true)}>
          <UserPlusIcon /> Invite advisor
        </Button>
      </div>
      <div className="rounded-2xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Advisor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Open customers</TableHead>
              <TableHead className="hidden md:table-cell">Joined</TableHead>
              <TableHead className="w-12 pr-4" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id} className={cn(r.status === "deactivated" && "opacity-60")}>
                <TableCell className="pl-4">
                  <div className="flex items-center gap-3">
                    <UserAvatar name={r.name} online={r.status === "active" ? r.online : undefined} />
                    <div>
                      <p className="font-medium">{r.name}</p>
                      <p className="text-xs text-muted-foreground">{r.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn("capitalize", STATUS[r.status])}>
                    {r.status === "invited" ? "Invite pending" : r.status}
                  </Badge>
                </TableCell>
                <TableCell className="hidden tabular-nums md:table-cell">{r.open ?? 0}</TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">{formatDate(r.joined)}</TableCell>
                <TableCell className="pr-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${r.name}`}>
                        <MoreHorizontalIcon />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {r.status === "invited" && (
                        <DropdownMenuItem onSelect={() => toast("Invite re-sent", { description: r.email })}>
                          <MailIcon /> Resend invite
                        </DropdownMenuItem>
                      )}
                      {r.status !== "deactivated" ? (
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={() =>
                            r.status === "invited" ? setRows((rs) => rs.filter((x) => x.id !== r.id)) : setActive(r, false)
                          }
                        >
                          {r.status === "invited" ? "Revoke invite" : "Deactivate"}
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onSelect={() => setActive(r, true)}>Reactivate</DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite a solar advisor</DialogTitle>
            <DialogDescription>They&apos;ll get an email with a link to create their account. The link expires in 7 days.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-name">Full name</Label>
              <Input id="invite-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Amaka Obi" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-email">Work email</Label>
              <Input id="invite-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="amaka@yourcompany.com" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button className={goldButton} disabled={!valid} onClick={invite}>
              Send invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
