import "server-only";
import { createRealtime, rawSql } from "@neon/realtime/server";
import type { SealedLiveQuery } from "@neon/realtime/server";
import { env } from "@/lib/env";
import { pool } from "@/lib/db";

// Anyone with NEON_REALTIME_SECRET can seal any query, so this module is server-only.
export const realtime = createRealtime({
  secret: env().NEON_REALTIME_SECRET,
  db: new URL(env().DATABASE_URL).pathname.slice(1),
});

type LiveDef = { text: string; params: (string | number | boolean | null)[] };

/** Row shapes. Only text/int/timestamptz columns, so server (pg) and live rows match. */
export type CustomerStatusRow = {
  user_id: string;
  stage: string;
  assigned_rep_id: string | null;
  rep_name: string | null;
  rep_title: string | null;
};

export type QueueRow = {
  user_id: string;
  name: string;
  email: string;
  city: string | null;
  property_type: string | null;
  created_at: Date | string;
  system_kva: string | null;
  estimate_kobo: string | null;
};

/** Live query definitions. Authorization lives in the SQL: parameters come only from the verified session. */
export const live = {
  customerStatus: (userId: string): LiveDef => ({
    text: `SELECT c.user_id, c.stage::text AS stage, c.assigned_rep_id, r.name AS rep_name, r.title AS rep_title
           FROM profiles c LEFT JOIN profiles r ON r.user_id = c.assigned_rep_id
           WHERE c.user_id = $1`,
    params: [userId],
  }),
  adminQueue: (): LiveDef => ({
    text: `SELECT p.user_id, p.name, p.email, p.city, p.property_type, p.created_at,
             (SELECT c.result->>'inverterKva' FROM calculations c WHERE c.customer_id = p.user_id ORDER BY c.created_at DESC LIMIT 1) AS system_kva,
             (SELECT c.result->>'totalKobo' FROM calculations c WHERE c.customer_id = p.user_id ORDER BY c.created_at DESC LIMIT 1) AS estimate_kobo
           FROM profiles p
           WHERE p.role = 'customer' AND p.assigned_rep_id IS NULL AND p.active
           ORDER BY p.created_at DESC
           LIMIT 50`,
    params: [],
  }),
};

export type LiveName = "customer-status" | "admin-queue";

export const sealLive = <Row>(def: LiveDef): Promise<SealedLiveQuery<Row>> => realtime.seal({ query: rawSql<Row>(def.text, def.params) });

/** Initial rows (server render) and the sealed query for the browser, built from one definition. */
export async function loadLive<Row>(def: LiveDef) {
  const [result, sealedQuery] = await Promise.all([pool.query(def.text, def.params), sealLive<Row>(def)]);
  return { initialData: result.rows as Row[], sealedQuery };
}
