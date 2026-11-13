// Pure slot generation. Lagos is UTC+1 all year (no daylight saving), so WAT wall time = UTC + 1h.
export type AvailabilityRule = { weekday: number; start: string; end: string }; // weekday 0 = Sunday, "HH:mm" in WAT

const WAT_OFFSET_MIN = 60;
export const SLOT_MINUTES = 30;
export const LEAD_TIME_MS = 2 * 60 * 60 * 1000;

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/** Lagos calendar date (y, m, d) for an instant. */
export function lagosYmd(d: Date) {
  const shifted = new Date(d.getTime() + WAT_OFFSET_MIN * 60_000);
  return { y: shifted.getUTCFullYear(), m: shifted.getUTCMonth(), d: shifted.getUTCDate(), weekday: shifted.getUTCDay() };
}

/** Instant for a Lagos wall-clock time. */
export function lagosTime(y: number, m: number, d: number, minutesOfDay: number) {
  return new Date(Date.UTC(y, m, d, 0, minutesOfDay - WAT_OFFSET_MIN));
}

/** Calendar date picked in the UI (its local y/m/d), interpreted as a Lagos date. */
export const calendarDay = (date: Date) => {
  const y = date.getFullYear();
  const m = date.getMonth();
  const d = date.getDate();
  return { y, m, d, weekday: new Date(Date.UTC(y, m, d)).getUTCDay() };
};

export function slotsForDay(
  day: { y: number; m: number; d: number; weekday: number },
  rules: AvailabilityRule[],
  taken: Date[],
  now = new Date(),
): Date[] {
  const { y, m, d, weekday } = day;
  const takenSet = new Set(taken.map((t) => t.getTime()));
  const out: Date[] = [];
  for (const r of rules.filter((x) => x.weekday === weekday)) {
    for (let t = toMinutes(r.start); t + SLOT_MINUTES <= toMinutes(r.end); t += SLOT_MINUTES) {
      const slot = lagosTime(y, m, d, t);
      if (slot.getTime() - now.getTime() < LEAD_TIME_MS) continue;
      if (takenSet.has(slot.getTime())) continue;
      out.push(slot);
    }
  }
  return out.sort((a, b) => a.getTime() - b.getTime());
}

export function weeklySlotCount(rules: AvailabilityRule[]) {
  return rules.reduce((t, r) => t + Math.max(0, Math.floor((toMinutes(r.end) - toMinutes(r.start)) / SLOT_MINUTES)), 0);
}
