// Pure sizing + pricing for an outage-backup solar system (formulas from docs/implementation-plan.md §5).

export type EquipmentKind = "panel" | "battery" | "inverter";

export type Equipment = {
  id: string;
  kind: EquipmentKind;
  name: string;
  /** panel: watts, battery: kWh, inverter: kVA */
  spec: number;
  priceKobo: number;
  isDefault?: boolean;
  active: boolean;
};

export type ApplianceLine = { id: string; name: string; qty: number; watts: number; hoursPerDay: number };

export type SizingSettings = {
  depositPercent: number;
  peakSunHours: number;
  systemEfficiency: number;
  batteryDod: number;
  inverterEfficiency: number;
  inverterSafetyFactor: number;
  powerFactor: number;
  installPercent: number;
  accessoriesPercent: number;
};

export type SizingResult = {
  peakLoadW: number;
  dailyEnergyWh: number;
  backupEnergyWh: number;
  inverterVA: number;
  inverter: Equipment | null;
  batteryWh: number;
  battery: Equipment | null;
  batteryUnits: number;
  arrayW: number;
  panel: Equipment | null;
  panels: number;
  cost: { panels: number; batteries: number; inverter: number; installation: number; accessories: number; total: number };
  depositKobo: number;
  /** Load is larger than the biggest inverter we stock. */
  customQuote: boolean;
  empty: boolean;
};

export function sizeSystem(
  lines: ApplianceLine[],
  backupHours: number,
  s: SizingSettings,
  catalog: Equipment[],
): SizingResult {
  const active = catalog.filter((e) => e.active);
  const panel = active.find((e) => e.kind === "panel" && e.isDefault) ?? active.find((e) => e.kind === "panel") ?? null;
  const battery =
    active.find((e) => e.kind === "battery" && e.isDefault) ?? active.find((e) => e.kind === "battery") ?? null;
  const inverters = active.filter((e) => e.kind === "inverter").sort((a, b) => a.spec - b.spec);

  const valid = lines.filter((l) => l.qty > 0 && l.watts > 0);
  const peakLoadW = valid.reduce((t, l) => t + l.qty * l.watts, 0);
  const dailyEnergyWh = valid.reduce((t, l) => t + l.qty * l.watts * l.hoursPerDay, 0);
  const backupEnergyWh = valid.reduce((t, l) => t + l.qty * l.watts * Math.min(l.hoursPerDay, backupHours), 0);

  const inverterVA = (peakLoadW * s.inverterSafetyFactor) / s.powerFactor;
  const inverter = inverters.find((i) => i.spec * 1000 >= inverterVA) ?? null;

  const batteryWh = backupEnergyWh / (s.batteryDod * s.inverterEfficiency);
  const batteryUnits = battery && batteryWh > 0 ? Math.ceil(batteryWh / (battery.spec * 1000)) : 0;

  const arrayW = dailyEnergyWh / (s.peakSunHours * s.systemEfficiency);
  const panels = panel && arrayW > 0 ? Math.ceil(arrayW / panel.spec) : 0;

  const cPanels = panels * (panel?.priceKobo ?? 0);
  const cBatteries = batteryUnits * (battery?.priceKobo ?? 0);
  const cInverter = peakLoadW > 0 ? (inverter ?? inverters.at(-1))?.priceKobo ?? 0 : 0;
  const equipment = cPanels + cBatteries + cInverter;
  const installation = Math.round(equipment * s.installPercent);
  const accessories = Math.round(equipment * s.accessoriesPercent);
  const total = equipment + installation + accessories;

  return {
    peakLoadW,
    dailyEnergyWh,
    backupEnergyWh,
    inverterVA,
    inverter,
    batteryWh,
    battery,
    batteryUnits,
    arrayW,
    panel,
    panels,
    cost: { panels: cPanels, batteries: cBatteries, inverter: cInverter, installation, accessories, total },
    depositKobo: Math.round((total * s.depositPercent) / 100),
    customQuote: peakLoadW > 0 && inverter === null,
    empty: peakLoadW === 0,
  };
}
