"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRightIcon,
  BatteryChargingIcon,
  CircleAlertIcon,
  GaugeIcon,
  MinusIcon,
  PlusIcon,
  RotateCcwIcon,
  SunIcon,
  Trash2Icon,
  ZapIcon,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatNumber, naira } from "@/lib/format";
import { sizeSystem, type ApplianceLine, type Equipment, type SizingSettings } from "@/lib/calc/size-system";
import type { Appliance, LoadPreset } from "@/lib/mock-data";
import { loadPresets } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { AnimatedNumber } from "@/components/shared/animated-number";
import { goldButton, eyebrow } from "@/components/shared/styles";
import { LoadCategories } from "./load-categories";

let nextId = 0;
const newId = () => `line-${++nextId}`;

export function Calculator({
  catalog,
  settings,
  appliances,
}: {
  catalog: Equipment[];
  settings: SizingSettings;
  appliances: Appliance[];
}) {
  const [preset, setPreset] = useState<LoadPreset | null>("residential");
  const [lines, setLines] = useState<ApplianceLine[]>(loadPresets.residential.lines);
  const [backupHours, setBackupHours] = useState(loadPresets.residential.backupHours);
  const [pickerOpen, setPickerOpen] = useState(false);

  const result = useMemo(() => sizeSystem(lines, backupHours, settings, catalog), [lines, backupHours, settings, catalog]);

  const applyPreset = (p: LoadPreset) => {
    setPreset(p);
    setLines(loadPresets[p].lines.map((l) => ({ ...l, id: newId() })));
    setBackupHours(loadPresets[p].backupHours);
  };

  const update = (id: string, patch: Partial<ApplianceLine>) => {
    setPreset(null);
    setLines((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  };

  const add = (a?: Appliance) => {
    setPreset(null);
    setPickerOpen(false);
    if (!a) {
      setLines((ls) => [...ls, { id: newId(), name: "Custom appliance", qty: 1, watts: 100, hoursPerDay: 4 }]);
      return;
    }
    setLines((ls) => {
      const existing = ls.find((l) => l.name === a.name);
      if (existing) return ls.map((l) => (l === existing ? { ...l, qty: l.qty + 1 } : l));
      return [...ls, { id: newId(), name: a.name, qty: 1, watts: a.watts, hoursPerDay: a.hours }];
    });
  };

  const categories = [...new Set(appliances.map((a) => a.category))];

  return (
    <section id="calculator" className="scroll-mt-20 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className={eyebrow}>The load calculator</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight uppercase sm:text-5xl">
            Start with <span className="text-gold-gradient">your load.</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Pick a starting point, then adjust the appliances you need running during an outage. Your system size and
            price update instantly.
          </p>
        </div>

        <LoadCategories value={preset} onChange={applyPreset} className="mx-auto mt-10 max-w-3xl" />
        <div className="gold-rule mx-auto mt-2 mb-10 w-24" />

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
          {/* appliances */}
          <div className="rounded-2xl border bg-card">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4 sm:p-5">
              <div>
                <h3 className="font-semibold">Your appliances</h3>
                <p className="text-sm text-muted-foreground">
                  {lines.length} item{lines.length === 1 ? "" : "s"} · {formatNumber(result.peakLoadW)} W if all run at once
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => applyPreset(preset ?? "residential")}>
                  <RotateCcwIcon /> Reset
                </Button>
                <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button size="sm" className={goldButton}>
                      <PlusIcon /> Add appliance
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-0" align="end">
                    <Command>
                      <CommandInput placeholder="Search appliances…" />
                      <CommandList className="max-h-80">
                        <CommandEmpty>No match. Add a custom appliance instead.</CommandEmpty>
                        {categories.map((c) => (
                          <CommandGroup key={c} heading={c}>
                            {appliances
                              .filter((a) => a.category === c)
                              .map((a) => (
                                <CommandItem key={a.id} value={a.name} onSelect={() => add(a)}>
                                  <span className="flex-1">{a.name}</span>
                                  <span className="text-xs text-muted-foreground">{a.watts} W</span>
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        ))}
                        <CommandSeparator />
                        <CommandGroup>
                          <CommandItem value="custom appliance" onSelect={() => add()}>
                            <PlusIcon /> Custom appliance
                          </CommandItem>
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {lines.length === 0 ? (
              <div className="p-10 text-center text-sm text-muted-foreground">
                No appliances yet. Pick a load type above or add an appliance.
              </div>
            ) : (
              <ul className="divide-y">
                <li className="hidden grid-cols-[minmax(0,1fr)_96px_120px_minmax(0,200px)_36px] gap-4 px-5 py-2.5 text-xs font-medium tracking-wide text-muted-foreground uppercase md:grid">
                  <span>Appliance</span>
                  <span>Watts</span>
                  <span>Quantity</span>
                  <span>Hours / day</span>
                  <span />
                </li>
                {lines.map((l) => (
                  <li
                    key={l.id}
                    className="relative grid grid-cols-2 items-center gap-x-4 gap-y-3 p-4 md:grid-cols-[minmax(0,1fr)_96px_120px_minmax(0,200px)_36px] md:px-5"
                  >
                    <div className="col-span-2 flex items-center gap-2 pr-10 md:col-span-1 md:pr-0">
                      <Input
                        value={l.name}
                        onChange={(e) => update(l.id, { name: e.target.value })}
                        aria-label="Appliance name"
                        className="h-9 border-transparent bg-transparent px-1 font-medium shadow-none hover:border-input focus-visible:border-ring dark:bg-transparent"
                      />
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                      <span className="text-xs text-muted-foreground md:hidden">Watts</span>
                      <Input
                        type="number"
                        min={0}
                        value={l.watts}
                        onChange={(e) => update(l.id, { watts: Math.max(0, Number(e.target.value)) })}
                        className="h-9 w-24 tabular-nums"
                        aria-label={`${l.name} watts`}
                      />
                    </label>
                    <div className="flex items-center justify-end gap-1 md:justify-start">
                      <Button variant="outline" size="icon-sm" aria-label="Decrease quantity" onClick={() => update(l.id, { qty: Math.max(1, l.qty - 1) })}>
                        <MinusIcon />
                      </Button>
                      <span className="w-8 text-center font-semibold tabular-nums">{l.qty}</span>
                      <Button variant="outline" size="icon-sm" aria-label="Increase quantity" onClick={() => update(l.id, { qty: l.qty + 1 })}>
                        <PlusIcon />
                      </Button>
                    </div>
                    <div className="col-span-2 flex items-center gap-3 md:col-span-1">
                      <span className="text-xs text-muted-foreground md:hidden">Hours</span>
                      <Slider
                        value={[l.hoursPerDay]}
                        min={0.5}
                        max={24}
                        step={0.5}
                        onValueChange={([v]) => update(l.id, { hoursPerDay: v })}
                        aria-label={`${l.name} hours per day`}
                      />
                      <span className="w-10 text-right text-sm tabular-nums">{l.hoursPerDay}h</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="absolute top-4 right-3 md:static"
                      aria-label={`Remove ${l.name}`}
                      onClick={() => {
                        setPreset(null);
                        setLines((ls) => ls.filter((x) => x.id !== l.id));
                      }}
                    >
                      <Trash2Icon className="text-muted-foreground" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            <div className="border-t bg-muted/40 p-4 sm:p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">Backup needed during an outage</p>
                  <p className="text-sm text-muted-foreground">How long should your batteries keep things running?</p>
                </div>
                <p className="font-display text-2xl font-bold text-gold-text tabular-nums">{backupHours}h</p>
              </div>
              <Slider className="mt-4" value={[backupHours]} min={1} max={24} step={1} onValueChange={([v]) => setBackupHours(v)} aria-label="Backup hours" />
              <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                <span>1h</span>
                <span>12h</span>
                <span>24h</span>
              </div>
            </div>
          </div>

          {/* results */}
          <aside className="gold-border sticky top-20 rounded-2xl p-5 sm:p-6" aria-live="polite">
            <p className={eyebrow}>Your recommended system</p>
            <p className="mt-3 text-sm text-muted-foreground">Estimated installed cost</p>
            <p className="font-display text-4xl font-extrabold tracking-tight text-gold-gradient">
              <AnimatedNumber value={result.cost.total} format={(n) => naira(n)} />
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {settings.depositPercent}% deposit ≈ {naira(result.depositKobo)} to book installation
            </p>

            <div className="mt-5 grid grid-cols-3 gap-2">
              <ResultTile icon={ZapIcon} label="Inverter" value={result.inverter ? `${result.inverter.spec} kVA` : result.empty ? "-" : "Custom"} />
              <ResultTile icon={SunIcon} label="Panels" value={result.panels ? `${result.panels} ×` : "-"} sub={result.panel ? `${result.panel.spec}W` : undefined} />
              <ResultTile icon={BatteryChargingIcon} label="Batteries" value={result.batteryUnits ? `${result.batteryUnits} ×` : "-"} sub={result.battery ? `${result.battery.spec}kWh` : undefined} />
            </div>

            {result.customQuote && (
              <div className="mt-4 flex gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-200">
                <CircleAlertIcon className="mt-0.5 size-4 shrink-0" />
                Your load is larger than our standard inverters. An expert will design a custom system for you.
              </div>
            )}

            <dl className="mt-5 grid grid-cols-3 gap-2 text-center">
              <Metric label="Peak load" value={`${formatNumber(result.peakLoadW / 1000, 1)} kW`} />
              <Metric label="Daily use" value={`${formatNumber(result.dailyEnergyWh / 1000, 1)} kWh`} />
              <Metric label="Backup" value={`${formatNumber(result.backupEnergyWh / 1000, 1)} kWh`} />
            </dl>

            <div className="my-5 h-px bg-border" />
            <dl className="space-y-2 text-sm">
              <Row label={`Solar panels${result.panel ? ` (${result.panels} × ${result.panel.spec}W)` : ""}`} value={result.cost.panels} />
              <Row label={`Batteries${result.battery ? ` (${result.batteryUnits} × ${result.battery.spec}kWh)` : ""}`} value={result.cost.batteries} />
              <Row label={`Inverter${result.inverter ? ` (${result.inverter.spec}kVA)` : ""}`} value={result.cost.inverter} />
              <Row label={`Installation (${settings.installPercent * 100}%)`} value={result.cost.installation} />
              <Row label={`Cabling & protection (${settings.accessoriesPercent * 100}%)`} value={result.cost.accessories} />
              <div className="flex justify-between border-t pt-2 font-semibold">
                <dt>Total</dt>
                <dd className="tabular-nums">{naira(result.cost.total)}</dd>
              </div>
            </dl>

            <Button asChild className={cn(goldButton, "mt-6 h-11 w-full text-base")} disabled={result.empty}>
              <Link href="/auth/sign-up?from=calculator">
                Talk to an expert <ArrowRightIcon />
              </Link>
            </Button>
            <Button
              variant="outline"
              className="mt-2 h-10 w-full"
              onClick={() => toast.success("Estimate saved", { description: "Create an account to keep it and share it with an expert." })}
            >
              Save this estimate
            </Button>
            <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
              <GaugeIcon className="mt-0.5 size-3.5 shrink-0" />
              Based on {settings.peakSunHours} peak sun hours and today&apos;s equipment prices. Final price is confirmed after a free site survey.
            </p>
          </aside>
        </div>
      </div>

      {/* mobile summary bar */}
      <div className="sticky bottom-0 z-30 mt-6 border-t bg-background/90 p-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-1">
          <div>
            <p className="text-xs text-muted-foreground">Estimated total</p>
            <p className="font-display text-lg font-bold text-gold-text tabular-nums">{naira(result.cost.total)}</p>
          </div>
          <Button asChild className={cn(goldButton, "h-10")}>
            <Link href="/auth/sign-up?from=calculator">
              Talk to an expert <ArrowRightIcon />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function ResultTile({ icon: Icon, label, value, sub }: { icon: typeof SunIcon; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border bg-background/60 p-3 text-center">
      <Icon className="mx-auto size-5 text-gold-text" />
      <p className="mt-2 font-display text-lg leading-none font-bold tabular-nums">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
      <p className="mt-1.5 text-[0.65rem] font-semibold tracking-[0.14em] text-muted-foreground uppercase">{label}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/60 px-2 py-2">
      <dt className="text-[0.65rem] tracking-wide text-muted-foreground uppercase">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="tabular-nums">{naira(value)}</dd>
    </div>
  );
}
