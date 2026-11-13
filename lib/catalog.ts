// Shared mapping between database rows and the calculator's types. Safe on server and client.
import { sizeSystem, type ApplianceLine, type Equipment, type SizingSettings } from "@/lib/calc/size-system";
import type { CalcSummary } from "@/lib/db/schema";

type SettingsRow = {
  deposit_percent: number;
  peak_sun_hours: number;
  system_efficiency: number;
  battery_dod: number;
  inverter_efficiency: number;
  inverter_safety_factor: number;
  power_factor: number;
  install_percent: number;
  accessories_percent: number;
};

type EquipmentRow = { id: string; kind: Equipment["kind"]; name: string; spec: number; price_kobo: number; is_default: boolean; active: boolean };

export const toSizingSettings = (r: SettingsRow): SizingSettings => ({
  depositPercent: r.deposit_percent,
  peakSunHours: r.peak_sun_hours,
  systemEfficiency: r.system_efficiency,
  batteryDod: r.battery_dod,
  inverterEfficiency: r.inverter_efficiency,
  inverterSafetyFactor: r.inverter_safety_factor,
  powerFactor: r.power_factor,
  installPercent: r.install_percent,
  accessoriesPercent: r.accessories_percent,
});

export const fromSizingSettings = (s: SizingSettings): SettingsRow => ({
  deposit_percent: s.depositPercent,
  peak_sun_hours: s.peakSunHours,
  system_efficiency: s.systemEfficiency,
  battery_dod: s.batteryDod,
  inverter_efficiency: s.inverterEfficiency,
  inverter_safety_factor: s.inverterSafetyFactor,
  power_factor: s.powerFactor,
  install_percent: s.installPercent,
  accessories_percent: s.accessoriesPercent,
});

export const toEquipment = (r: EquipmentRow): Equipment => ({
  id: r.id,
  kind: r.kind,
  name: r.name,
  spec: r.spec,
  priceKobo: r.price_kobo,
  isDefault: r.is_default,
  active: r.active,
});

/** Server-side recomputation of a calculation, plus the price snapshot to store with it. */
export function summarizeCalculation(lines: ApplianceLine[], backupHours: number, settings: SizingSettings, catalog: Equipment[]) {
  const r = sizeSystem(lines, backupHours, settings, catalog);
  const summary: CalcSummary = {
    inverterKva: r.inverter?.spec ?? null,
    panels: r.panels,
    panelWatts: r.panel?.spec ?? null,
    batteryUnits: r.batteryUnits,
    batteryKwh: r.battery?.spec ?? null,
    dailyEnergyWh: Math.round(r.dailyEnergyWh),
    peakLoadW: Math.round(r.peakLoadW),
    totalKobo: r.cost.total,
    depositKobo: r.depositKobo,
    customQuote: r.customQuote,
  };
  const priceSnapshot = Object.fromEntries(catalog.filter((e) => e.active).map((e) => [e.id, e.priceKobo]));
  return { summary, priceSnapshot };
}
