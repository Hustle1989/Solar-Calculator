import { BatteryChargingIcon, SunIcon, ZapIcon } from "lucide-react";
import { formatNumber, naira } from "@/lib/format";
import { sizeSystem, type ApplianceLine } from "@/lib/calc/size-system";
import { equipment, settings } from "@/lib/mock-data";

/** Compact read-only view of a saved calculation. */
export function SystemSummary({ lines, backupHours, showAppliances = true }: { lines: ApplianceLine[]; backupHours: number; showAppliances?: boolean }) {
  const r = sizeSystem(lines, backupHours, settings, equipment);
  const tiles = [
    { icon: ZapIcon, label: "Inverter", value: r.inverter ? `${r.inverter.spec} kVA` : "Custom" },
    { icon: SunIcon, label: "Solar panels", value: `${r.panels} × ${r.panel?.spec}W`, sub: `${formatNumber((r.panels * (r.panel?.spec ?? 0)) / 1000, 1)} kWp array` },
    { icon: BatteryChargingIcon, label: "Batteries", value: `${r.batteryUnits} × ${r.battery?.spec}kWh`, sub: `${formatNumber(r.batteryUnits * (r.battery?.spec ?? 0), 0)} kWh storage` },
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
            {t.sub && <p className="text-xs text-muted-foreground">{t.sub}</p>}
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2 rounded-xl bg-muted/50 px-4 py-3 text-sm">
        <span className="text-muted-foreground">
          {formatNumber(r.dailyEnergyWh / 1000, 1)} kWh/day · {backupHours}h backup
        </span>
        <span>
          Estimate <span className="font-semibold text-gold-text">{naira(r.cost.total)}</span>
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
