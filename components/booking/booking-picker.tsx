"use client";

import { useMemo, useState } from "react";
import { CalendarCheckIcon, ClockIcon, VideoIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDateTime, formatDay, formatTime } from "@/lib/format";
import { calendarDay, LEAD_TIME_MS, slotsForDay, SLOT_MINUTES } from "@/lib/booking/slots";
import { availability, bookings as seed, type Booking } from "@/lib/mock-data";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { UserAvatar, EmptyState } from "@/components/shared/ui-bits";
import { goldButton } from "@/components/shared/styles";
import { useCall } from "@/components/call/call-provider";

const TOPICS = ["Walk through my quote", "Technical questions", "Installation planning", "Something else"];

export function BookingPicker({ customerId, rep }: { customerId: string; rep: { id: string; name: string; title: string; online: boolean } }) {
  const { startCall } = useCall();
  const [all, setAll] = useState<Booking[]>(seed);
  const [date, setDate] = useState<Date | undefined>();
  const [slot, setSlot] = useState<Date | null>(null);
  const [topic, setTopic] = useState(TOPICS[0]);
  const [notes, setNotes] = useState("");
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);

  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);
  const lastDay = useMemo(() => new Date(today.getTime() + 13 * 86_400_000), [today]);
  const taken = all.filter((b) => b.repId === rep.id && b.status === "booked").map((b) => b.startsAt);
  const slots = date ? slotsForDay(calendarDay(date), availability, taken) : [];
  const mine = all.filter((b) => b.customerId === customerId && b.status === "booked").sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());

  const confirm = () => {
    if (!slot) return;
    setAll((bs) => [
      ...bs.map((b) => (b.id === rescheduleId ? { ...b, status: "cancelled" as const } : b)),
      { id: `bk-${Date.now()}`, customerId, repId: rep.id, startsAt: slot, status: "booked", topic },
    ]);
    toast.success(rescheduleId ? "Call rescheduled" : "Call booked", { description: `${formatDateTime(slot)} with ${rep.name}. A confirmation email is on its way.` });
    setSlot(null);
    setDate(undefined);
    setNotes("");
    setRescheduleId(null);
  };

  const lagosHour = (s: Date) => (s.getUTCHours() + 1) % 24; // WAT = UTC+1
  const morning = slots.filter((s) => lagosHour(s) < 12);
  const afternoon = slots.filter((s) => lagosHour(s) >= 12);

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-6">
        <div className="rounded-2xl border bg-card p-4 sm:p-6">
          {rescheduleId && (
            <div className="mb-4 flex items-center justify-between gap-3 rounded-lg bg-gold-soft px-3 py-2 text-sm">
              <span>Choose a new time for your call.</span>
              <Button variant="ghost" size="sm" onClick={() => setRescheduleId(null)}>
                Cancel reschedule
              </Button>
            </div>
          )}
          <div className="grid gap-6 md:grid-cols-[auto_minmax(0,1fr)]">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => {
                setDate(d);
                setSlot(null);
              }}
              disabled={(d) => d < today || d > lastDay || !availability.some((r) => r.weekday === d.getDay())}
              className="mx-auto rounded-xl border [--cell-size:--spacing(9)]"
            />
            <div className="min-w-0">
              {!date ? (
                <EmptyState icon={CalendarCheckIcon} title="Pick a day" description="Choose a highlighted day to see open times. Calls are 30 minutes on video." className="h-full" />
              ) : slots.length === 0 ? (
                <EmptyState icon={ClockIcon} title="Fully booked" description="No open times left on this day. Try another day." className="h-full" />
              ) : (
                <div>
                  <p className="font-semibold">{formatDay(slots[0])}</p>
                  <p className="text-xs text-muted-foreground">All times in Lagos time (WAT)</p>
                  {[
                    ["Morning", morning],
                    ["Afternoon", afternoon],
                  ].map(([label, list]) =>
                    (list as Date[]).length ? (
                      <div key={label as string} className="mt-4">
                        <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">{label as string}</p>
                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                          {(list as Date[]).map((s) => (
                            <button
                              key={s.getTime()}
                              onClick={() => setSlot(s)}
                              aria-pressed={slot?.getTime() === s.getTime()}
                              className={cn(
                                "rounded-lg border px-2 py-2 text-sm font-medium tabular-nums transition hover:border-gold",
                                slot?.getTime() === s.getTime() && "border-transparent bg-gold-gradient text-black",
                              )}
                            >
                              {formatTime(s)}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null,
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* upcoming */}
        <div className="rounded-2xl border bg-card">
          <div className="border-b px-5 py-4">
            <p className="font-semibold">Your upcoming calls</p>
          </div>
          {mine.length === 0 ? (
            <p className="p-5 text-sm text-muted-foreground">No calls booked yet.</p>
          ) : (
            <ul className="divide-y">
              {mine.map((b) => {
                const msTo = b.startsAt.getTime() - Date.now();
                const joinable = msTo < 10 * 60_000;
                const locked = msTo < LEAD_TIME_MS;
                return (
                  <li key={b.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-gold-soft text-gold-text">
                      <VideoIcon className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{formatDateTime(b.startsAt)}</p>
                      <p className="text-sm text-muted-foreground">
                        {b.topic} · with {rep.name}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className={goldButton} disabled={!joinable} onClick={() => startCall(rep.name)} title={joinable ? undefined : "Opens 10 minutes before the call"}>
                        Join
                      </Button>
                      <Button size="sm" variant="outline" disabled={locked} onClick={() => setRescheduleId(b.id)}>
                        Reschedule
                      </Button>
                      <Button size="sm" variant="ghost" disabled={locked} onClick={() => setCancelId(b.id)}>
                        Cancel
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* summary */}
      <aside className="gold-border space-y-5 rounded-2xl p-5 lg:sticky lg:top-24">
        <div className="flex items-center gap-3">
          <UserAvatar name={rep.name} online={rep.online} size="lg" gold />
          <div>
            <p className="font-semibold">{rep.name}</p>
            <p className="text-xs text-muted-foreground">{rep.title}</p>
          </div>
          <Badge variant="outline" className="ml-auto">
            {SLOT_MINUTES} min
          </Badge>
        </div>
        <div className="rounded-xl bg-muted/60 p-4">
          <p className="text-xs text-muted-foreground uppercase">Selected time</p>
          <p className="mt-1 font-display text-lg font-bold">{slot ? formatDateTime(slot) : "Not selected"}</p>
          {slot && <p className="text-xs text-muted-foreground">Ends {formatTime(new Date(slot.getTime() + SLOT_MINUTES * 60_000))} WAT · Video call</p>}
        </div>
        <div className="space-y-2">
          <Label>What would you like to discuss?</Label>
          <Select value={topic} onValueChange={setTopic}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TOPICS.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes">Notes for {rep.name.split(" ")[0]} (optional)</Label>
          <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. My husband will join from his phone" />
        </div>
        <Button className={cn(goldButton, "h-11 w-full")} disabled={!slot} onClick={confirm}>
          {rescheduleId ? "Confirm new time" : "Confirm booking"}
        </Button>
        <p className="text-center text-xs text-muted-foreground">You can reschedule or cancel up to 2 hours before. We&apos;ll email reminders 24 hours and 1 hour before the call.</p>
      </aside>

      <Dialog open={!!cancelId} onOpenChange={(o) => !o && setCancelId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel this call?</DialogTitle>
            <DialogDescription>{rep.name} will be notified and the time becomes available to others.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelId(null)}>
              Keep call
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setAll((bs) => bs.map((b) => (b.id === cancelId ? { ...b, status: "cancelled" } : b)));
                setCancelId(null);
                toast("Call cancelled");
              }}
            >
              Cancel call
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
