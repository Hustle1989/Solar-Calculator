"use client";

import { useState } from "react";
import { MailIcon, MoreHorizontalIcon, UserPlusIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import { customers, type Rep } from "@/lib/mock-data";
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

export function RepsManager({ initial }: { initial: Rep[] }) {
  const [rows, setRows] = useState(initial);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const valid = /^\S+@\S+\.\S+$/.test(email) && name.trim().length > 1;

  const invite = () => {
    setRows((r) => [...r, { id: `r-${Date.now()}`, name: name.trim(), email: email.trim(), phone: "", title: "Solar Advisor", status: "invited", online: false, joined: new Date() }]);
    toast.success("Invite sent", { description: `${email} has 7 days to accept.` });
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
                <TableCell className="hidden tabular-nums md:table-cell">
                  {customers.filter((c) => c.repId === r.id && c.stage !== "completed").length}
                </TableCell>
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
                          onSelect={() => {
                            setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, status: "deactivated" } : x)));
                            toast(`${r.name} deactivated`, { description: "Reassign their open customers from the Customers page." });
                          }}
                        >
                          {r.status === "invited" ? "Revoke invite" : "Deactivate"}
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onSelect={() => setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, status: "active" } : x)))}>Reactivate</DropdownMenuItem>
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
