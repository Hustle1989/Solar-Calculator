/**
 * Seeds the catalog (settings, appliances, equipment) and demo accounts.
 *
 *   npm run db:seed
 *
 * Demo accounts are real Neon Auth users created through the Auth API, then given profiles, saved
 * calculations and stage history. Safe to re-run: it upserts. Remove the demo accounts before launch.
 */
try {
  process.loadEnvFile(".env.local");
} catch {}

import { drizzle } from "drizzle-orm/node-postgres";
import { eq, inArray } from "drizzle-orm";
import { Pool } from "pg";
import * as schema from "../lib/db/schema";
import { appliances as catalogAppliances, customers as mockCustomers, demoCalculation, equipment as catalogEquipment, loadPresets, reps as mockReps, settings as defaultSettings, admin as mockAdmin, type LoadPreset } from "../lib/mock-data";
import { fromSizingSettings, summarizeCalculation } from "../lib/catalog";
import { STAGES, stageIndex, type Stage } from "../lib/stages";

const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD ?? "SolarDemo#2026";
const ORIGIN = "http://localhost:3000"; // localhost is a trusted origin for Neon Auth by default

const pool = new Pool({ connectionString: process.env.DATABASE_URL!.replace("sslmode=require", "sslmode=verify-full") });
const db = drizzle(pool, { schema });
const { profiles, settings, appliances, equipment, calculations, stageEvents } = schema;

async function authCall(path: string, body: object) {
  const res = await fetch(`${process.env.NEON_AUTH_BASE_URL}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: ORIGIN },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as { user?: { id: string }; code?: string; message?: string };
  return { ok: res.ok, status: res.status, json };
}

/** Creates the Neon Auth user, or signs in if it already exists. Returns the user id. */
async function ensureAuthUser(email: string, name: string): Promise<string> {
  const up = await authCall("/sign-up/email", { email, password: DEMO_PASSWORD, name });
  if (up.ok && up.json.user?.id) return up.json.user.id;
  const inRes = await authCall("/sign-in/email", { email, password: DEMO_PASSWORD });
  if (inRes.ok && inRes.json.user?.id) return inRes.json.user.id;
  throw new Error(`Could not create or sign in ${email}: sign-up ${up.status} ${up.json.code ?? up.json.message ?? ""}; sign-in ${inRes.status} ${inRes.json.code ?? inRes.json.message ?? ""}`);
}

const presetFor: Record<string, LoadPreset> = { Home: "residential", Office: "business", Shop: "business", Warehouse: "industrial", School: "specialized" };

async function main() {
  console.log("Seeding catalog…");
  await db.insert(settings).values({ id: 1, ...fromSizingSettings(defaultSettings) }).onConflictDoUpdate({ target: settings.id, set: fromSizingSettings(defaultSettings) });

  for (const [i, a] of catalogAppliances.entries()) {
    const row = { id: a.id, name: a.name, watts: a.watts, hours: a.hours, category: a.category, active: true, sort: i };
    await db.insert(appliances).values(row).onConflictDoUpdate({ target: appliances.id, set: row });
  }
  for (const e of catalogEquipment) {
    const row = { id: e.id, kind: e.kind, name: e.name, spec: e.spec, price_kobo: e.priceKobo, is_default: !!e.isDefault, active: e.active };
    await db.insert(equipment).values(row).onConflictDoUpdate({ target: equipment.id, set: row });
  }
  console.log(`  settings 1, appliances ${catalogAppliances.length}, equipment ${catalogEquipment.length}`);

  console.log("Creating demo accounts in Neon Auth…");
  const idFor = new Map<string, string>(); // mock id -> auth user id

  const adminId = await ensureAuthUser(mockAdmin.email, mockAdmin.name);
  idFor.set(mockAdmin.id, adminId);
  await upsertProfile({ user_id: adminId, role: "admin", name: mockAdmin.name, email: mockAdmin.email, title: mockAdmin.title, stage: "new" });

  for (const r of mockReps.filter((x) => x.status === "active")) {
    const id = await ensureAuthUser(r.email, r.name);
    idFor.set(r.id, id);
    await upsertProfile({ user_id: id, role: "rep", name: r.name, email: r.email, phone: r.phone, title: r.title, stage: "new", created_at: r.joined });
  }

  const catalog = catalogEquipment;
  for (const c of mockCustomers) {
    const id = await ensureAuthUser(c.email, c.name);
    idFor.set(c.id, id);
    await upsertProfile({
      user_id: id,
      role: "customer",
      name: c.name,
      email: c.email,
      phone: c.phone,
      city: c.city,
      address: c.address,
      property_type: c.propertyType,
      stage: c.stage,
      assigned_rep_id: c.repId ? idFor.get(c.repId) ?? null : null,
      created_at: c.signedUp,
      updated_at: c.lastActivity,
    });

    // One saved calculation per customer, recomputed with the seeded prices.
    const calc = c.id === "c-1001" ? demoCalculation : { lines: loadPresets[presetFor[c.propertyType]].lines, backupHours: loadPresets[presetFor[c.propertyType]].backupHours };
    const { summary, priceSnapshot } = summarizeCalculation(calc.lines, calc.backupHours, defaultSettings, catalog);
    await db.delete(calculations).where(eq(calculations.customer_id, id));
    await db.insert(calculations).values({ customer_id: id, backup_hours: calc.backupHours, lines: calc.lines, result: summary, price_snapshot: priceSnapshot, created_at: c.signedUp });

    // Stage history up to the current stage.
    await db.delete(stageEvents).where(eq(stageEvents.customer_id, id));
    const repName = mockReps.find((r) => r.id === c.repId)?.name;
    const history = STAGES.slice(0, stageIndex(c.stage) + 1).map((s, i, all) => ({
      customer_id: id,
      from_stage: i === 0 ? null : (all[i - 1].id as Stage),
      to_stage: s.id,
      changed_by: i === 0 ? c.name : s.id === "assigned" ? mockAdmin.name : s.id === "deposit_paid" ? "Paystack" : repName ?? mockAdmin.name,
      note: s.id === "assigned" && repName ? `Assigned to ${repName}` : null,
      created_at: new Date(Math.min(c.signedUp.getTime() + i * 2 * 86_400_000, Date.now() - (all.length - i) * 3_600_000)),
    }));
    await db.insert(stageEvents).values(history);
  }

  const counts = await db.select({ role: profiles.role }).from(profiles).where(inArray(profiles.user_id, [...idFor.values()]));
  const by = counts.reduce<Record<string, number>>((t, r) => ({ ...t, [r.role]: (t[r.role] ?? 0) + 1 }), {});
  console.log(`  profiles: ${JSON.stringify(by)}`);
  console.log(`Done. Demo password for every seeded account: ${DEMO_PASSWORD}`);
}

async function upsertProfile(row: typeof profiles.$inferInsert) {
  const { user_id, ...rest } = row;
  await db.insert(profiles).values(row).onConflictDoUpdate({ target: profiles.user_id, set: { ...rest, updated_at: rest.updated_at ?? new Date() } });
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
