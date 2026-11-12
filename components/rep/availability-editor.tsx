"use client";

import { useState } from "react";
import { CopyIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { weeklySlotCount, type AvailabilityRule } from "@/lib/booking/slots";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { goldButton } from "@/components/shared/styles";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const WEEKDAY = [1, 2, 3, 4, 5, 6, 0];
const TIMES = Array.from({ length: 29 }, (_, i) => {
  const m = 7 * 60 + i * 30;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
});
const label = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
};

type Day = { on: boolean; start: string; end: string };

export function AvailabilityEditor({ initial }: { initial: AvailabilityRule[] }) {
  const [days, setDays] = useState<Day[]>(
    WEEKDAY.map((wd) => {
      const r = initial.find((x) => x.weekday === wd);
      return r ? { on: true, start: r.start, end: r.end } : { on: false, start: "09:00", end: "17:00" };
    }),
  );
  const rules: AvailabilityRule[] = days.flatMap((d, i) => (d.on && d.start < d.end ? [{ weekday: WEEKDAY[i], start: d.start, end: d.end }] : []));
  const set = (i: number, patch: Partial<Day>) => setDays((ds) => ds.map((d, j) => (j === i ? { ...d, ...patch } : d)));

  return (
    <div className="rounded-2xl border bg-card">
      <div className="flex flex-wrap items-center gap-3 border-b p-4 sm:p-5">
        <div className="flex-1">
          <p className="font-semibold">Weekly hours</p>
          <p className="text-sm text-muted-foreground">
            {weeklySlotCount(rules)} bookable 30-minute slots per week · Lagos time (WAT)
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setDays((ds) => ds.map((d, i) => (i > 0 && i < 5 ? { ...ds[0] } : d)));
            toast("Copied Monday to Tuesday–Friday");
          }}
        >
          <CopyIcon /> Copy Monday to weekdays
        </Button>
      </div>
      <ul className="divide-y">
        {days.map((d, i) => (
          <li key={DAYS[i]} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:px-5">
            <label className="flex w-40 items-center gap-3">
              <Switch checked={d.on} onCheckedChange={(on) => set(i, { on })} aria-label={`Available on ${DAYS[i]}`} />
              <span className={cn("font-medium", !d.on && "text-muted-foreground")}>{DAYS[i]}</span>
            </label>
            {d.on ? (
              <div className="flex items-center gap-2">
                <TimeSelect value={d.start} onChange={(start) => set(i, { start })} label={`${DAYS[i]} start`} />
                <span className="text-muted-foreground">to</span>
                <TimeSelect value={d.end} onChange={(end) => set(i, { end })} label={`${DAYS[i]} end`} />
                {d.start >= d.end && <span className="text-xs text-destructive">End must be after start</span>}
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">Unavailable</span>
            )}
          </li>
        ))}
      </ul>
      <div className="flex justify-end border-t p-4 sm:px-5">
        <Button className={goldButton} onClick={() => toast.success("Availability saved", { description: "Customers can now book these times." })}>
          Save availability
        </Button>
      </div>
    </div>
  );
}

function TimeSelect({ value, onChange, label: aria }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-32" aria-label={aria}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {TIMES.map((t) => (
          <SelectItem key={t} value={t}>
            {label(t)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
