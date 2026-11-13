import { BatteryChargingIcon, SunIcon, ZapIcon } from "lucide-react";
import { formatNumber, naira } from "@/lib/format";
import { sizeSystem, type ApplianceLine } from "@/lib/calc/size-system";
import type { CalcSummary } from "@/lib/db/schema";
import { equipment, settings } from "@/lib/mock-data";

/**
 * Compact read-only view of a saved calculation. Pass the stored `summary` (computed on the server when
 * it was saved); without it, the result is recomputed from the demo catalog (preview screens only).
 */
export function SystemSummary({
  lines,
  backupHours,
  summary,
  showAppliances = true,
}: {
  lines: ApplianceLine[];
  backupHours: number;
  summary?: CalcSummary;
  showAppliances?: boolean;
}) {
  const s = summary ?? toSummary(lines, backupHours);
  const tiles = [
    { icon: ZapIcon, label: "Inverter", value: s.inverterKva ? `${s.inverterKva} kVA` : "Custom", sub: `${formatNumber(s.peakLoadW / 1000, 1)} kW peak load` },
    { icon: SunIcon, label: "Solar panels", value: `${s.panels} × ${s.panelWatts ?? "-"}W`, sub: `${formatNumber((s.panels * (s.panelWatts ?? 0)) / 1000, 1)} kWp array` },
    { icon: BatteryChargingIcon, label: "Batteries", value: `${s.batteryUnits} × ${s.batteryKwh ?? "-"}kWh`, sub: `${formatNumber(s.batteryUnits * (s.batteryKwh ?? 0), 0)} kWh storage` },
  ];
  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-3">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-xl border bg-background/50 p-3.5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <t.icon className="size-4 text-gold-text" /> {t.label}
            </div>
            <p className="mt-1.5 font-display text-lg font-bold">{t.value}</p>
            <p className="text-xs text-muted-foreground">{t.sub}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2 rounded-xl bg-muted/50 px-4 py-3 text-sm">
        <span className="text-muted-foreground">
          {formatNumber(s.dailyEnergyWh / 1000, 1)} kWh/day · {backupHours}h backup
        </span>
        <span>
          Estimate <span className="font-semibold text-gold-text">{naira(s.totalKobo)}</span>
        </span>
      </div>
      {showAppliances && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {lines.map((l) => (
            <li key={l.id} className="rounded-full border bg-background/60 px-2.5 py-1 text-xs">
              {l.qty} × {l.name} <span className="text-muted-foreground">· {l.hoursPerDay}h</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function toSummary(lines: ApplianceLine[], backupHours: number): CalcSummary {
  const r = sizeSystem(lines, backupHours, settings, equipment);
  return {
    inverterKva: r.inverter?.spec ?? null,
    panels: r.panels,
    panelWatts: r.panel?.spec ?? null,
    batteryUnits: r.batteryUnits,
    batteryKwh: r.battery?.spec ?? null,
    dailyEnergyWh: r.dailyEnergyWh,
    peakLoadW: r.peakLoadW,
    totalKobo: r.cost.total,
    depositKobo: r.depositKobo,
    customQuote: r.customQuote,
  };
}
