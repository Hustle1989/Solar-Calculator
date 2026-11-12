"use client";

import { useState } from "react";

const SYSTEM_EFFICIENCY = 0.8; // wiring, inverter and heat losses
const BATTERY_DEPTH_OF_DISCHARGE = 0.8; // usable share of battery capacity

export default function Home() {
  const [dailyUsage, setDailyUsage] = useState(10); // kWh per day
  const [sunHours, setSunHours] = useState(5); // peak sun hours per day
  const [panelWatts, setPanelWatts] = useState(400); // W per panel
  const [backupDays, setBackupDays] = useState(1); // days of battery backup

  const valid = dailyUsage > 0 && sunHours > 0 && panelWatts > 0 && backupDays >= 0;

  const systemKw = valid ? dailyUsage / (sunHours * SYSTEM_EFFICIENCY) : 0;
  const panels = valid ? Math.ceil((systemKw * 1000) / panelWatts) : 0;
  const installedKw = (panels * panelWatts) / 1000;
  const batteryKwh = valid ? (dailyUsage * backupDays) / BATTERY_DEPTH_OF_DISCHARGE : 0;
  const yearlyKwh = installedKw * sunHours * SYSTEM_EFFICIENCY * 365;

  return (
    <main>
      <h1>Solar Calculator</h1>
      <p className="lead">
        Enter how much electricity you use to estimate the panels and battery you need.
      </p>

      <section className="card">
        <Field label="Daily energy use" unit="kWh" value={dailyUsage} onChange={setDailyUsage} step={0.5} />
        <Field label="Peak sun hours" unit="hrs/day" value={sunHours} onChange={setSunHours} step={0.5} />
        <Field label="Panel size" unit="W" value={panelWatts} onChange={setPanelWatts} step={10} />
        <Field label="Battery backup" unit="days" value={backupDays} onChange={setBackupDays} step={0.5} />
      </section>

      {valid ? (
        <section className="results">
          <Result label="Panels needed" value={panels.toString()} />
          <Result label="System size" value={`${installedKw.toFixed(2)} kW`} />
          <Result label="Battery storage" value={`${batteryKwh.toFixed(1)} kWh`} />
          <Result label="Yearly production" value={`${Math.round(yearlyKwh).toLocaleString()} kWh`} />
        </section>
      ) : (
        <p className="error">Enter numbers greater than zero to see results.</p>
      )}

      <p className="note">
        Assumes {SYSTEM_EFFICIENCY * 100}% system efficiency and {BATTERY_DEPTH_OF_DISCHARGE * 100}% usable
        battery capacity. These are rough estimates; get a site survey before buying.
      </p>
    </main>
  );
}

function Field({
  label,
  unit,
  value,
  onChange,
  step,
}: {
  label: string;
  unit: string;
  value: number;
  onChange: (v: number) => void;
  step: number;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="input">
        <input
          type="number"
          min={0}
          step={step}
          value={Number.isNaN(value) ? "" : value}
          onChange={(e) => onChange(e.target.valueAsNumber)}
        />
        <span className="unit">{unit}</span>
      </div>
    </label>
  );
}

function Result({ label, value }: { label: string; value: string }) {
  return (
    <div className="result">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
