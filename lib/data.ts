import "server-only";
import { and, asc, count, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { toEquipment, toSizingSettings } from "@/lib/catalog";
import type { Appliance, ApplianceCategory, Customer, Rep } from "@/lib/mock-data";
import { settings as fallbackSettings } from "@/lib/mock-data";
import type { Profile } from "@/lib/db/schema";

const { profiles, calculations, stageEvents } = schema;

// ---------- catalog ----------
export async function getCatalog() {
  const [settingsRow, equipmentRows, applianceRows] = await Promise.all([
    db.query.settings.findFirst(),
    db.select().from(schema.equipment).orderBy(asc(schema.equipment.kind), asc(schema.equipment.spec)),
    db.select().from(schema.appliances).orderBy(asc(schema.appliances.sort)),
  ]);
  return {
    settings: settingsRow ? toSizingSettings(settingsRow) : fallbackSettings,
    equipment: equipmentRows.map(toEquipment),
    appliances: applianceRows.map<Appliance & { active: boolean }>((a) => ({
      id: a.id,
      name: a.name,
      watts: a.watts,
      hours: a.hours,
      category: a.category as ApplianceCategory,
      active: a.active,
    })),
  };
}

// ---------- people ----------
async function latestCalcs(customerIds: string[]) {
  if (customerIds.length === 0) return new Map<string, typeof calculations.$inferSelect>();
  const rows = await db.select().from(calculations).where(inArray(calculations.customer_id, customerIds)).orderBy(desc(calculations.created_at));
  const map = new Map<string, typeof calculations.$inferSelect>();
  for (const r of rows) if (!map.has(r.customer_id)) map.set(r.customer_id, r);
  return map;
}

/** Customers in the shape the UI tables use. Pass a rep id to list only that rep's customers. */
export async function listCustomers(opts: { repId?: string } = {}): Promise<Customer[]> {
  const rows = await db
    .select()
    .from(profiles)
    .where(and(eq(profiles.role, "customer"), opts.repId ? eq(profiles.assigned_rep_id, opts.repId) : undefined))
    .orderBy(desc(profiles.created_at));
  const calcs = await latestCalcs(rows.map((r) => r.user_id));
  return rows.map((p) => toCustomer(p, calcs.get(p.user_id)));
}

export function toCustomer(p: Profile, calc?: typeof calculations.$inferSelect): Customer {
  return {
    id: p.user_id,
    name: p.name,
    email: p.email,
    phone: p.phone ?? "",
    city: p.city ?? "",
    address: p.address ?? "",
    propertyType: (p.property_type as Customer["propertyType"]) ?? "Home",
    stage: p.stage,
    repId: p.assigned_rep_id,
    signedUp: p.created_at,
    systemKva: calc?.result.inverterKva ?? 0,
    estimateKobo: calc?.result.totalKobo ?? 0,
    lastActivity: p.updated_at,
  };
}

export type RepOption = { id: string; name: string; online?: boolean; open: number };

export async function listReps(): Promise<(Rep & { open: number })[]> {
  const reps = await db.select().from(profiles).where(eq(profiles.role, "rep")).orderBy(asc(profiles.name));
  const loads = await db
    .select({ rep: profiles.assigned_rep_id, n: count() })
    .from(profiles)
    .where(and(eq(profiles.role, "customer"), sql`${profiles.stage} <> 'completed'`))
    .groupBy(profiles.assigned_rep_id);
  const open = new Map(loads.map((l) => [l.rep, l.n]));
  return reps.map((r) => ({
    id: r.user_id,
    name: r.name,
    email: r.email,
    phone: r.phone ?? "",
    title: r.title ?? "Solar Advisor",
    status: r.active ? "active" : "deactivated",
    online: false,
    joined: r.created_at,
    open: open.get(r.user_id) ?? 0,
  }));
}

export async function getProfile(userId: string) {
  return db.query.profiles.findFirst({ where: eq(profiles.user_id, userId) });
}

/** Everything the customer record pages need. */
export async function getCustomerRecord(userId: string) {
  const profile = await getProfile(userId);
  if (!profile || profile.role !== "customer") return null;
  const [rep, calc, events] = await Promise.all([
    profile.assigned_rep_id ? getProfile(profile.assigned_rep_id) : Promise.resolve(undefined),
    db.query.calculations.findFirst({ where: eq(calculations.customer_id, userId), orderBy: desc(calculations.created_at) }),
    db.select().from(stageEvents).where(eq(stageEvents.customer_id, userId)).orderBy(asc(stageEvents.created_at)),
  ]);
  return { profile, rep, calc, events };
}

// ---------- admin ----------
export async function getAdminOverview() {
  const weekAgo = new Date(Date.now() - 7 * 86_400_000);
  const [byStage, signups, activity] = await Promise.all([
    db.select({ stage: profiles.stage, n: count() }).from(profiles).where(eq(profiles.role, "customer")).groupBy(profiles.stage),
    db.select({ n: count() }).from(profiles).where(and(eq(profiles.role, "customer"), gte(profiles.created_at, weekAgo))),
    db
      .select({ id: stageEvents.id, to: stageEvents.to_stage, note: stageEvents.note, by: stageEvents.changed_by, at: stageEvents.created_at, customer: profiles.name })
      .from(stageEvents)
      .innerJoin(profiles, eq(profiles.user_id, stageEvents.customer_id))
      .orderBy(desc(stageEvents.created_at))
      .limit(8),
  ]);
  return { byStage: new Map(byStage.map((s) => [s.stage, s.n])), signupsThisWeek: signups[0]?.n ?? 0, activity };
}
