// Database schema (Drizzle). Keys are snake_case and match column names, which the Neon Realtime
// Drizzle adapter requires for live queries.
import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import type { ApplianceLine } from "@/lib/calc/size-system";

export const roleEnum = pgEnum("role", ["customer", "rep", "admin"]);
export const stageEnum = pgEnum("stage", ["new", "assigned", "quote_sent", "deposit_paid", "site_survey", "installation", "completed"]);
export const equipmentKindEnum = pgEnum("equipment_kind", ["panel", "battery", "inverter"]);

/** One row per Neon Auth user. `user_id` is the Neon Auth user id (neon_auth schema). */
export const profiles = pgTable(
  "profiles",
  {
    user_id: text("user_id").primaryKey(),
    role: roleEnum("role").notNull().default("customer"),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    city: text("city"),
    address: text("address"),
    property_type: text("property_type"),
    title: text("title"),
    stage: stageEnum("stage").notNull().default("new"),
    assigned_rep_id: text("assigned_rep_id").references((): AnyPgColumn => profiles.user_id, { onDelete: "set null" }),
    active: boolean("active").notNull().default(true),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("profiles_role_idx").on(t.role), index("profiles_rep_idx").on(t.assigned_rep_id), index("profiles_email_idx").on(t.email)],
);

/** Single row (id = 1) of admin-editable calculator settings. */
export const settings = pgTable(
  "settings",
  {
    id: integer("id").primaryKey().default(1),
    deposit_percent: integer("deposit_percent").notNull(),
    peak_sun_hours: doublePrecision("peak_sun_hours").notNull(),
    system_efficiency: doublePrecision("system_efficiency").notNull(),
    battery_dod: doublePrecision("battery_dod").notNull(),
    inverter_efficiency: doublePrecision("inverter_efficiency").notNull(),
    inverter_safety_factor: doublePrecision("inverter_safety_factor").notNull(),
    power_factor: doublePrecision("power_factor").notNull(),
    install_percent: doublePrecision("install_percent").notNull(),
    accessories_percent: doublePrecision("accessories_percent").notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [check("settings_single_row", sql`${t.id} = 1`)],
);

export const appliances = pgTable("appliances", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  watts: integer("watts").notNull(),
  hours: doublePrecision("hours").notNull(),
  category: text("category").notNull(),
  active: boolean("active").notNull().default(true),
  sort: integer("sort").notNull().default(0),
});

export const equipment = pgTable("equipment", {
  id: text("id").primaryKey(),
  kind: equipmentKindEnum("kind").notNull(),
  name: text("name").notNull(),
  /** panel: watts, battery: kWh, inverter: kVA */
  spec: doublePrecision("spec").notNull(),
  price_kobo: bigint("price_kobo", { mode: "number" }).notNull(),
  is_default: boolean("is_default").notNull().default(false),
  active: boolean("active").notNull().default(true),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Summary stored with each saved calculation (recomputed on the server, never trusted from the client). */
export type CalcSummary = {
  inverterKva: number | null;
  panels: number;
  panelWatts: number | null;
  batteryUnits: number;
  batteryKwh: number | null;
  dailyEnergyWh: number;
  peakLoadW: number;
  totalKobo: number;
  depositKobo: number;
  customQuote: boolean;
};

export const calculations = pgTable(
  "calculations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customer_id: text("customer_id")
      .notNull()
      .references(() => profiles.user_id, { onDelete: "cascade" }),
    backup_hours: doublePrecision("backup_hours").notNull(),
    lines: jsonb("lines").$type<ApplianceLine[]>().notNull(),
    result: jsonb("result").$type<CalcSummary>().notNull(),
    /** Prices used for this calculation, so later price changes don't rewrite history. */
    price_snapshot: jsonb("price_snapshot").$type<Record<string, number>>().notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("calculations_customer_idx").on(t.customer_id, t.created_at)],
);

/** Append-only history of stage changes. */
export const stageEvents = pgTable(
  "stage_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customer_id: text("customer_id")
      .notNull()
      .references(() => profiles.user_id, { onDelete: "cascade" }),
    from_stage: stageEnum("from_stage"),
    to_stage: stageEnum("to_stage").notNull(),
    changed_by: text("changed_by"),
    note: text("note"),
    created_at: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("stage_events_customer_idx").on(t.customer_id, t.created_at)],
);

export type Profile = typeof profiles.$inferSelect;
export type Role = Profile["role"];
