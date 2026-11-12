# Implementation Plan: Solar Calculator Platform v1

Status: DRAFT, awaiting approval. No application code is written until this is approved.
Spec: [spec.md](spec.md). Versions and SDK details were checked on 2026-11-12 (npm registry, Next 16 bundled docs, Neon and Stream docs).

---

## 1. Before we start: accounts you need to create

| Service | What to create | Needed by |
|---|---|---|
| GitHub | Private repo (this folder becomes a git repo) | Phase 0 |
| Neon | Project in an **AWS** region close to Nigeria (eu-west-2 London or eu-central-1 Frankfurt). Managed Auth is AWS-only, and Realtime is region-limited, so confirm the region is supported before creating the project | Phase 0 |
| Sentry | Org + Next.js project; connect GitHub for Seer | Phase 0 |
| Cloudways | Velocity (managed Node.js) app, Node 24 LTS, same region as Neon | Phase 0 |
| Google Cloud | OAuth client (production; Neon's shared Google credentials are fine for local dev) | Phase 1 |
| Stream | Two apps: `dev` and `prod` (Chat + Video enabled) | Phase 2 |
| Resend | Account + verified sending domain (needs DNS access) | Phase 2 |
| Paystack | Business account; test keys now, live keys after business verification | Phase 3 |
| ImageKit | Account; private files enabled | Phase 4 |

Also: authorize the Neon MCP plugin (`/mcp`) so I can create branches and enable Auth and Realtime for you.

## 2. Foundation decisions

| Decision | Choice | Why |
|---|---|---|
| Runtime | Node **24 LTS** (`engines` + `.nvmrc`) | Velocity offers Node 22/24 only. Local dev on Node 26 still works, but we target 24 |
| DB driver | `drizzle-orm/node-postgres` + `pg` Pool, using Neon's **pooled** URL | Velocity is a long-running server, not serverless. A normal pool gives real transactions (needed for payments). |
| ORM / validation | Drizzle 0.45 + drizzle-kit 0.31, Zod 4 | Typed schema and migrations. Neon Realtime has a Drizzle adapter |
| Auth | `@neon/auth` 0.8 (Managed Better Auth) + Better Auth UI (shadcn) | Prebuilt sign-in, sign-up and reset screens that match our UI. Pages live at `/auth/[path]` |
| Route protection | `proxy.ts` (Next 16 renamed `middleware` → `proxy`) using `auth.middleware()` | Signed-out users are redirected. **Every** server action and route handler re-checks role and ownership |
| Realtime | `@neon/realtime` 0.2 + `-drizzle` + `-react` (**beta, pin exact versions**) | Sealed live queries, renewed from route handlers |
| UI | Tailwind v4 + shadcn/ui, `next-themes` (light/dark), `sonner` toasts, react-hook-form + Zod | Premium components without a heavy UI framework |
| Money | Integer **kobo** (`bigint`, `mode: "number"`) everywhere | No float rounding; Paystack uses kobo natively |
| Time | Store `timestamptz` (UTC). Display in `Africa/Lagos` (UTC+1, no daylight saving) | One time zone, no DST edge cases |
| TypeScript | Keep TS 7 (the build passes). Pin to 5.9 only if Sentry or ESLint tooling breaks | Avoid a downgrade unless forced |
| Tests | Vitest 5 for pure logic and route handlers | Fast, no browser setup |

## 3. Project structure

```
app/
  page.tsx                      landing + calculator (public, SEO)
  auth/[path]/page.tsx          Better Auth UI views (sign-in, sign-up, reset…)
  invite/[token]/page.tsx       rep invite acceptance
  dashboard/…                   customer area
  rep/…                         rep area
  admin/…                       admin area
  api/auth/[...path]/route.ts   Neon Auth handler
  api/live/[name]/route.ts      seal + renew Neon Realtime queries
  api/stream/token/route.ts     Stream user token
  api/imagekit/auth/route.ts    signed upload params
  api/paystack/webhook/route.ts
  api/cron/reminders/route.ts
  sitemap.ts  robots.ts  opengraph-image.tsx  global-error.tsx
components/ui/                  shadcn components
components/<feature>/           calculator, chat, video, booking, quotes, media…
lib/
  env.ts                        Zod-validated env (server) + public env
  db/index.ts  db/schema.ts
  auth/server.ts  auth/client.ts  auth/guards.ts
  calc/size-system.ts           pure sizing + pricing (unit-tested)
  booking/slots.ts              pure slot generation (unit-tested)
  stages.ts                     allowed stage transitions
  paystack.ts  stream.ts  imagekit.ts  realtime.ts
  email/send.ts  email/templates/*.tsx
  actions/*.ts                  server actions grouped by domain
scripts/seed.ts                 appliances, equipment, settings, first admin
drizzle/                        migrations
neon.ts  proxy.ts  instrumentation.ts  instrumentation-client.ts
```

**Authorization helpers** (`lib/auth/guards.ts`), used at the top of every action and handler:
- `getViewer()`: session + profile. Creates the `profiles` row on first visit (role `customer`, stage `new`).
- `requireRole(...roles)`: throws or redirects if the role doesn't match.
- `requireCustomerAccess(customerId)`: allowed for the customer themselves, their assigned rep, or an admin.
- Every action validates input with Zod **before** touching the DB.

## 4. Data model details

The tables are as listed in the spec, with these refinements:
- `profiles.stage` enum: `new → assigned → quote_sent → deposit_paid → site_survey → installation → completed`.
  Allowed moves live in `lib/stages.ts`. Only the Paystack webhook can set `deposit_paid`.
- `equipment.kind`: `panel | battery | inverter`, plus an `is_default` flag for the panel and battery the calculator uses.
  Installation and accessories are **percentages in `settings`** rather than equipment rows (simpler for v1).
- `settings` (one row): `deposit_percent` (30), `peak_sun_hours` (5), `system_efficiency` (0.8), `battery_dod` (0.8),
  `inverter_efficiency` (0.9), `inverter_safety_factor` (1.25), `power_factor` (0.8), `install_percent`, `accessories_percent`.
- `quotes`: add `balance_paid_at`. Sending a new quote cancels the customer's older unaccepted quotes.
- `bookings`: partial unique index `(rep_id, starts_at) WHERE status = 'booked'`.
- `reminders_sent`: unique `(booking_id, kind)`.
- `media`: add `visibility` (`private | public`). Customer site and progress media are private. Equipment and chat attachments are public with unguessable names (see risk R4).
- Every table has a primary key (Neon Realtime requires one). **No row-level security** on tables read by live queries (Realtime rejects RLS); authorization lives in the sealed query.

## 5. Calculator formulas (`lib/calc/size-system.ts`)

Inputs: lines `{ name, qty, watts, hoursPerDay }[]`, and `backupHours` (default 8).

```
peakLoadW      = Σ qty × watts
dailyEnergyWh  = Σ qty × watts × hoursPerDay
backupEnergyWh = Σ qty × watts × min(hoursPerDay, backupHours)

inverterVA     = peakLoadW × inverter_safety_factor / power_factor
inverter       = smallest active inverter with kVA × 1000 ≥ inverterVA   (none big enough → flag "custom quote")

batteryWh      = backupEnergyWh / (battery_dod × inverter_efficiency)
batteryUnits   = ceil(batteryWh / defaultBattery.kWh × 1000)

arrayW         = dailyEnergyWh / (peak_sun_hours × system_efficiency)
panels         = ceil(arrayW / defaultPanel.watts)

equipment      = panels × panelPrice + batteryUnits × batteryPrice + inverterPrice
total          = equipment × (1 + install_percent + accessories_percent)
```

The function is pure: it takes inputs, settings and prices, and returns sizes plus a cost breakdown. Unit tests cover the formulas, rounding, empty input and the inverter overflow. **An installer should review these formulas before launch.**

---

## Phase 0: Foundation (deployed empty shell)

1. `git init`, `.gitignore`, push to GitHub. Add `engines.node: ">=24 <25"` and `.nvmrc`.
2. Tailwind v4 + `shadcn init`; design tokens (near-black/white base, solar-amber accent, Geist font), `next-themes`, base layout, header/footer, theme toggle.
3. `lib/env.ts` validates every env var with Zod at startup.
4. Neon: project + `production` and `dev` branches, `neon.ts`, `neon env pull` → `.env.local`. Drizzle config, `pg` pool, first migration (profiles + settings).
5. Sentry: `@sentry/nextjs` 11 via the wizard → `instrumentation.ts`, `instrumentation-client.ts`, `global-error.tsx`,
   `withSentryConfig` (source-map upload via `SENTRY_AUTH_TOKEN`). Replay with `maskAllInputs`, environment tags, `Sentry.setUser({ id })` (no email).
6. Cloudways Velocity: connect GitHub `main`. Build = `npm ci && npm run db:migrate && npm run build`, start = `npm start`.
   Set env vars, domain and SSL. **Check: Velocity cron feature, build memory.**

**Done when:** pushing to `main` deploys, the site loads on the domain over HTTPS, and a test error shows up in Sentry with a readable stack trace.

## Phase 1: Calculator + auth + admin pricing

1. Schema: `appliances`, `equipment`, `settings`, `calculations`. `scripts/seed.ts` loads about 25 common Nigerian appliances with typical watts,
   2–3 panels, batteries and inverters at placeholder NGN prices, and default settings.
2. `lib/calc/size-system.ts` + Vitest tests.
3. Landing page `/`: hero, how it works, and the **calculator**: an appliance picker (search combobox), quantity stepper, hours slider,
   custom appliance row and backup-hours input. A sticky results card shows panels, battery, inverter and cost breakdown with animated numbers.
   Prices come from a server component; the math runs on the client using the same pure function. The draft is kept in localStorage.
   "Talk to an expert" goes to `/auth/sign-up?redirectTo=/dashboard?saveCalc=1`.
4. Neon Auth: `neon.ts` `auth: true` → `neon deploy`; `lib/auth/server.ts` (`createNeonAuth`), `app/api/auth/[...path]/route.ts`,
   `lib/auth/client.ts` (`createAuthClient()` from `@neon/auth/next`), Better Auth UI at `app/auth/[path]`, Google enabled.
   `proxy.ts` uses `auth.middleware({ loginUrl: "/auth/sign-in", publicRoutes: ["/", "/invite", "/api/paystack", "/api/cron"] })`.
   After `npx shadcn add`, run `npm i better-auth@~1.7.12` so only one copy is installed (Neon's guidance).
5. Guards + `getViewer()`; role-based landing: customer → `/dashboard`, rep → `/rep`, admin → `/admin`.
6. `/dashboard` (first version): on `saveCalc=1`, the client posts the localStorage draft to `saveCalculation` (server recomputes the result and stores a price snapshot). Shows the saved calculation and the "Assigning your expert…" state.
7. Admin pricing at `/admin/pricing`: CRUD for equipment and appliances, plus a settings form. Seed script `--admin you@domain` sets the first admin.
8. SEO: metadata, `opengraph-image.tsx`, `sitemap.ts`, `robots.ts`; `noindex` on signed-in layouts.

**Done when:** a visitor calculates without an account, signs up (email or Google) and lands on the dashboard with the calculation saved. An admin changes a price and the calculator reflects it. Calculator tests pass.

## Phase 2: Assignment + live status + chat + ring video + email + invites

1. **Resend:** `lib/email/send.ts` + React templates. Send after the DB commit; a failure is logged to Sentry and never blocks the user's action.
   Also point Neon Auth's custom SMTP at Resend SMTP so production auth emails work (Neon requires custom SMTP in production).
2. **Rep invites:** `/admin/reps`: invite by email → `invites` row (random 32-byte token, store only its SHA-256 hash, 7-day expiry) → email with `/invite/[token]`.
   Accepting requires a signed-in session whose email matches the invite (case-insensitive) → role `rep`. Admins can deactivate reps.
3. **Assignment:** `/admin` unassigned queue → "Assign" dialog → transaction: set `assigned_rep_id`, stage `assigned`, `stage_events` row
   → create the Stream channel → emails to customer and rep. Admin can reassign (assumption A10).
4. **Neon Realtime:** enable on the branch with an allowed origin. `lib/realtime.ts`: `createRealtime({ adapter: drizzleAdapter() })`.
   `app/api/live/[name]/route.ts` checks the session and role, then seals:
   - `customer-status`: the customer's profile stage, assigned rep and quotes summary (filtered by the session user's id)
   - `admin-queue`: unassigned customers (admin only)
   - `rep-customers`: the rep's customers and stages
   The client uses `useLiveQuery(sealed, { refreshQuery })` and renews through the same route handler. The initial data is server-rendered.
   **Fallback** if Realtime is unavailable: `router.refresh()` every 15 seconds behind the same component.
5. **Stream Chat:** `@stream-io/node-sdk` in `lib/stream.ts`; `/api/stream/token` upserts the user (name, avatar, role) and returns a token.
   Channel `messaging:customer-<id>` with members customer + rep; admins get the Stream `admin` role.
   `stream-chat-react` 15: channel list (rep), single channel (customer), `Thread`, reactions, replies. Uses Stream's CDN until Phase 4.
6. **Stream Video:** `@stream-io/video-react-sdk`. A global `<IncomingCall/>` in signed-in layouts. A video button in the chat header
   → `call("default", id).getOrCreate({ ring: true, members })` → full-screen call UI with speaker and grid layouts.

**Done when:** a new signup appears live in the admin queue. Assigning a rep updates the customer dashboard live, emails both people and opens their chat. Reactions, replies, threads and ring video work between two browsers. Invited reps can sign up and land on `/rep`.

## Phase 3: Quotes + Paystack deposit + stage tracker

1. **Quote builder** at `/rep/customers/[id]`: prefilled from the calculation, editable line items, live totals, deposit = settings % (snapshotted).
   Send → status `sent`, stage `quote_sent`, email to the customer. Accepted quotes are read-only.
2. **Customer quote page** `/dashboard/quotes/[id]`: breakdown → Accept → "Pay deposit ₦X".
3. **Paystack** (`lib/paystack.ts`, plain `fetch`):
   - `startDepositPayment(quoteId)`: guard → reuse an existing `pending` payment, or create a reference `dep_<quote>_<rand>` →
     `POST /transaction/initialize` (email, amount in kobo, reference, callback_url, metadata) → redirect to `authorization_url`.
   - Webhook: verify `x-paystack-signature` = HMAC-SHA512(raw body, secret key) → on `charge.success` call `confirmDeposit(reference)`.
   - Callback page: `GET /transaction/verify/:reference` → also calls `confirmDeposit`, so the UI updates even if the webhook is slow.
   - `confirmDeposit` (idempotent): check amount and currency match. In **one transaction**: update the payment with `WHERE status = 'pending'`
     (0 rows means it was already processed, so stop), quote → `deposit_paid`, stage → `deposit_paid`, `stage_events`. Emails go out after commit.
4. **Stage tracker:** a live stepper on the customer dashboard. The rep's "Advance stage" control only offers transitions from `lib/stages.ts`. "Mark balance paid" sets `balance_paid_at`.
5. Tests: signature check (valid, invalid, tampered), duplicate webhook does nothing, wrong amount is rejected, stage-transition rules.

**Done when:** in test mode, the rep sends a quote, the customer accepts and pays with a Paystack test card, and the dashboard flips to "Deposit paid" live. Replaying the webhook changes nothing. The rep can walk the customer through to Completed.

## Phase 4: Availability + booking + reminders + ImageKit

1. **Availability:** `/rep/availability` weekly grid (weekday, start, end).
2. **Slots:** `lib/booking/slots.ts` (pure, tested) covers the next 14 days in 30-minute slots, removing taken slots and anything within the 2-hour lead time.
   `/dashboard/book` is a calendar plus slot picker. `bookCall` re-validates the slot, and the insert's unique-index conflict becomes a friendly "That slot was just taken."
   Creates a Stream call `booking-<id>` with `starts_at`. The Join button is active from 10 minutes before the call. Cancel or reschedule is allowed up to 2 hours before. Emails go to both people.
3. **Reminders:** `/api/cron/reminders` requires `Authorization: Bearer CRON_SECRET`. For due 24-hour and 1-hour reminders it first
   `INSERT … ON CONFLICT DO NOTHING RETURNING` (claims the reminder), then sends. On a send failure it deletes the claim so the next run retries.
   Scheduled every 5 minutes with the Velocity cron, or cron-job.org as a fallback.
4. **ImageKit** (`@imagekit/next`):
   - `/api/imagekit/auth`: guarded; returns signed upload params for a folder the server chooses from the role and target
     (`/{env}/customers/<id>/site`, `/…/progress`, `/{env}/equipment`, `/{env}/chat/<channel>`).
   - The browser uploads directly (images ≤10MB, videos ≤100MB, type checks on both sides). Then `recordMedia(fileId)`, where the server **fetches the file from the ImageKit API** to confirm its folder and size before inserting a `media` row.
   - Private customer media is shown via short-lived **signed URLs** generated on the server for allowed viewers only.
   - Upload UIs: customer site media (`/dashboard/media`), rep progress media per stage, admin equipment images.
   - **Chat attachments:** switch the Stream message composer to `attachments.doUploadRequest` → ImageKit, with `customCdn: true`.

**Done when:** a customer books an open slot, a double-booking attempt fails cleanly, both people get confirmation emails and reminders (tested by running the cron route by hand), and the scheduled call joins. All four upload types work, and private media can't be opened by another customer.

---

## Cross-cutting

- **Security:** server-only secrets (never `NEXT_PUBLIC_`); guards on every action and handler; Zod on every input; webhook signature checks;
  CRON_SECRET; sealed live queries never put in URLs or logs; basic per-IP rate limiting (in-memory, single server) on save-calculation, upload-auth and invite routes.
- **Edge cases:** a double-clicked pay button reuses the pending payment; a stale quote is locked after acceptance; a Stream or ImageKit outage shows an
  inline error while the dashboard keeps working; an expired session redirects to sign-in with `redirectTo`; slow networks get skeletons and disabled submit buttons.
- **Observability:** Sentry errors, tracing (20% sampling in production) and replay; business events as Sentry logs:
  `signup`, `assigned`, `quote_sent`, `deposit_paid`, `booking_created`, `email_failed`.
- **Privacy (NDPA):** privacy policy page, consent checkbox at sign-up, an admin "deactivate user" control, and no customer PII in Sentry.

## Environment variables

`DATABASE_URL`, `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET`, `NEON_REALTIME_URL`, `NEXT_PUBLIC_NEON_REALTIME_URL`, `NEON_REALTIME_SECRET`,
`NEXT_PUBLIC_STREAM_API_KEY`, `STREAM_API_SECRET`, `PAYSTACK_SECRET_KEY`, `NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT`,
`NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_PRIVATE_KEY`, `RESEND_API_KEY`, `EMAIL_FROM`, `ADMIN_NOTIFY_EMAIL`,
`NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `CRON_SECRET`, `NEXT_PUBLIC_APP_URL`.
Local values come from the Neon `dev` branch and test or dev keys. Production values are set in the Velocity panel. An `.env.example` is committed.

## Verification (each phase)

1. `npm run test` (Vitest) and `npm run build` pass.
2. The manual end-to-end checklist for that phase's "Done when", run locally, then on production after deploy.
3. Sentry shows no new unhandled errors from the checklist run.
4. Final v1 check: the full definition-of-done journey from the spec, on production with Paystack test mode.

## Risks specific to implementation

- **R1 Neon Realtime is beta (0.2.x):** pin exact versions and keep the polling fallback ready.
- **R2 Neon Auth custom SMTP:** must be configured before launch, or production verification and reset emails fail.
- **R3 Velocity:** if it has no cron, use cron-job.org. If the build runs out of memory, set `NODE_OPTIONS=--max-old-space-size`.
- **R4 Chat attachments are public:** signed URLs would expire inside old chat messages, so chat files use public, unguessable ImageKit paths. Site and progress media stay private.
- **R5 Migrations at build:** keep migrations additive (no destructive changes in the same deploy as the code that relies on them).
- **R6 Paystack webhooks** can't reach localhost. Locally we rely on the verify-on-callback path; webhooks are tested on production in test mode.
