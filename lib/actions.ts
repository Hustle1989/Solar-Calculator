"use server";

import { revalidatePath } from "next/cache";
import { and, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { assertViewer, AuthError, canAccessCustomer } from "@/lib/auth/viewer";
import { getCatalog } from "@/lib/data";
import { fromSizingSettings, summarizeCalculation } from "@/lib/catalog";
import { REP_NEXT_STAGE, stageLabel, type Stage } from "@/lib/stages";

export type ActionResult = { ok: true } | { ok: false; error: string };

async function run(fn: () => Promise<void>): Promise<ActionResult> {
  try {
    await fn();
    return { ok: true };
  } catch (e) {
    if (e instanceof AuthError) return { ok: false, error: e.message };
    if (e instanceof z.ZodError) return { ok: false, error: e.issues[0]?.message ?? "Invalid input." };
    if (e instanceof UserError) return { ok: false, error: e.message };
    console.error("[action]", e);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}

class UserError extends Error {}

const { profiles, stageEvents } = schema;

// ---------- customer ----------
const lineSchema = z.object({
  id: z.string().max(80),
  name: z.string().trim().min(1).max(80),
  qty: z.number().int().min(1).max(500),
  watts: z.number().min(1).max(50_000),
  hoursPerDay: z.number().min(0).max(24),
});
const calcSchema = z.object({ lines: z.array(lineSchema).min(1).max(60), backupHours: z.number().min(1).max(24) });

/** Saves a calculator draft to the signed-in customer's account. The result is recomputed here. */
export async function saveCalculation(input: unknown): Promise<ActionResult> {
  return run(async () => {
    const viewer = await assertViewer(["customer"]);
    const { lines, backupHours } = calcSchema.parse(input);
    const { settings, equipment } = await getCatalog();
    const { summary, priceSnapshot } = summarizeCalculation(lines, backupHours, settings, equipment);
    await db.insert(schema.calculations).values({ customer_id: viewer.userId, backup_hours: backupHours, lines, result: summary, price_snapshot: priceSnapshot });
    revalidatePath("/dashboard");
  });
}

const contactSchema = z.object({
  phone: z.string().trim().max(20).regex(/^[0-9 +()-]*$/, "Enter a valid phone number.").optional(),
  city: z.string().trim().max(60).optional(),
});

export async function updateMyContact(input: unknown): Promise<ActionResult> {
  return run(async () => {
    const viewer = await assertViewer(["customer", "rep", "admin"]);
    const data = contactSchema.parse(input);
    await db
      .update(profiles)
      .set({ ...(data.phone ? { phone: data.phone } : {}), ...(data.city ? { city: data.city } : {}), updated_at: new Date() })
      .where(eq(profiles.user_id, viewer.userId));
  });
}

// ---------- admin: assignment & accounts ----------
const assignSchema = z.object({ customerId: z.string().min(1), repId: z.string().min(1) });

export async function assignAdvisor(input: unknown): Promise<ActionResult> {
  return run(async () => {
    const viewer = await assertViewer(["admin"]);
    const { customerId, repId } = assignSchema.parse(input);
    const [customer, rep] = await Promise.all([
      db.query.profiles.findFirst({ where: and(eq(profiles.user_id, customerId), eq(profiles.role, "customer")) }),
      db.query.profiles.findFirst({ where: and(eq(profiles.user_id, repId), eq(profiles.role, "rep"), eq(profiles.active, true)) }),
    ]);
    if (!customer) throw new UserError("Customer not found.");
    if (!rep) throw new UserError("That advisor isn't active.");
    if (customer.assigned_rep_id === repId) return;

    const nextStage: Stage = customer.stage === "new" ? "assigned" : customer.stage;
    await db.transaction(async (tx) => {
      await tx.update(profiles).set({ assigned_rep_id: repId, stage: nextStage, updated_at: new Date() }).where(eq(profiles.user_id, customerId));
      await tx.insert(stageEvents).values({
        customer_id: customerId,
        from_stage: customer.stage,
        to_stage: nextStage,
        changed_by: viewer.profile.name,
        note: customer.assigned_rep_id ? `Reassigned to ${rep.name}` : `Assigned to ${rep.name}`,
      });
    });
    revalidatePath("/admin", "layout");
    revalidatePath("/rep", "layout");
  });
}

const activeSchema = z.object({ userId: z.string().min(1), active: z.boolean() });

export async function setAccountActive(input: unknown): Promise<ActionResult> {
  return run(async () => {
    const viewer = await assertViewer(["admin"]);
    const { userId, active } = activeSchema.parse(input);
    if (userId === viewer.userId) throw new UserError("You can't deactivate your own account.");
    await db.update(profiles).set({ active, updated_at: new Date() }).where(eq(profiles.user_id, userId));
    revalidatePath("/admin", "layout");
  });
}

// ---------- rep: stage control ----------
const advanceSchema = z.object({ customerId: z.string().min(1), to: z.string(), note: z.string().trim().max(500).optional() });

export async function advanceStage(input: unknown): Promise<ActionResult> {
  return run(async () => {
    const viewer = await assertViewer(["rep", "admin"]);
    const { customerId, to, note } = advanceSchema.parse(input);
    const customer = await db.query.profiles.findFirst({ where: and(eq(profiles.user_id, customerId), eq(profiles.role, "customer")) });
    if (!customer || !canAccessCustomer(viewer, customer)) throw new AuthError(403, "You don't have access to this customer.");
    // Only the allowed manual moves. deposit_paid is set by the payment webhook, never by hand.
    if (REP_NEXT_STAGE[customer.stage] !== to) throw new UserError(`Can't move from ${stageLabel(customer.stage)} to that stage.`);
    const next = to as Stage;
    await db.transaction(async (tx) => {
      // Guard against a concurrent change: only update if the stage is still what we read.
      const updated = await tx
        .update(profiles)
        .set({ stage: next, updated_at: new Date() })
        .where(and(eq(profiles.user_id, customerId), eq(profiles.stage, customer.stage)))
        .returning({ id: profiles.user_id });
      if (updated.length === 0) throw new UserError("This customer's stage just changed. Refresh and try again.");
      await tx.insert(stageEvents).values({ customer_id: customerId, from_stage: customer.stage, to_stage: next, changed_by: viewer.profile.name, note: note || null });
    });
    revalidatePath(`/rep/customers/${customerId}`);
  });
}

// ---------- admin: pricing ----------
const equipmentSchema = z.object({
  id: z.string().trim().min(1).max(40).regex(/^[a-z0-9.-]+$/i),
  kind: z.enum(["panel", "battery", "inverter"]),
  name: z.string().trim().min(2).max(80),
  spec: z.number().positive().max(10_000),
  priceKobo: z.number().int().positive().max(1e13),
  isDefault: z.boolean().optional(),
  active: z.boolean(),
});

export async function saveEquipment(input: unknown): Promise<ActionResult> {
  return run(async () => {
    await assertViewer(["admin"]);
    const e = equipmentSchema.parse(input);
    const row = { kind: e.kind, name: e.name, spec: e.spec, price_kobo: e.priceKobo, active: e.active, updated_at: new Date() };
    await db.insert(schema.equipment).values({ id: e.id, ...row }).onConflictDoUpdate({ target: schema.equipment.id, set: row });
    revalidatePath("/", "layout");
  });
}

export async function setDefaultEquipment(input: unknown): Promise<ActionResult> {
  return run(async () => {
    await assertViewer(["admin"]);
    const { id } = z.object({ id: z.string().min(1) }).parse(input);
    const item = await db.query.equipment.findFirst({ where: eq(schema.equipment.id, id) });
    if (!item || item.kind === "inverter") throw new UserError("Only a panel or battery can be the default.");
    await db.transaction(async (tx) => {
      await tx.update(schema.equipment).set({ is_default: false }).where(and(eq(schema.equipment.kind, item.kind), ne(schema.equipment.id, id)));
      await tx.update(schema.equipment).set({ is_default: true, active: true }).where(eq(schema.equipment.id, id));
    });
    revalidatePath("/", "layout");
  });
}

const applianceSchema = z.object({
  id: z.string().trim().min(1).max(60),
  name: z.string().trim().min(1).max(80),
  watts: z.number().int().min(1).max(50_000),
  hours: z.number().min(0).max(24),
  category: z.string().trim().min(1).max(40),
});

/** Replaces the appliance catalog with the submitted list (in order). */
export async function saveAppliances(input: unknown): Promise<ActionResult> {
  return run(async () => {
    await assertViewer(["admin"]);
    const list = z.array(applianceSchema).max(200).parse(input);
    await db.transaction(async (tx) => {
      await tx.delete(schema.appliances);
      if (list.length) await tx.insert(schema.appliances).values(list.map((a, i) => ({ ...a, active: true, sort: i })));
    });
    revalidatePath("/", "layout");
  });
}

const settingsSchema = z.object({
  depositPercent: z.number().int().min(1).max(100),
  peakSunHours: z.number().min(1).max(10),
  systemEfficiency: z.number().min(0.3).max(1),
  batteryDod: z.number().min(0.3).max(1),
  inverterEfficiency: z.number().min(0.5).max(1),
  inverterSafetyFactor: z.number().min(1).max(3),
  powerFactor: z.number().min(0.5).max(1),
  installPercent: z.number().min(0).max(0.5),
  accessoriesPercent: z.number().min(0).max(0.5),
});

export async function saveSettings(input: unknown): Promise<ActionResult> {
  return run(async () => {
    await assertViewer(["admin"]);
    const s = settingsSchema.parse(input);
    const row = { ...fromSizingSettings(s), updated_at: new Date() };
    await db.insert(schema.settings).values({ id: 1, ...row }).onConflictDoUpdate({ target: schema.settings.id, set: row });
    revalidatePath("/", "layout");
  });
}
