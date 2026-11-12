# Solar Calculator Platform: v1 Spec

Status: APPROVED 2026-11-12. See docs/implementation-plan.md.

## Context
The user wants to turn the existing simple Next.js solar calculator (this repo: `app/page.tsx`,
Next.js 16.4 / React 19 / TS, plain CSS) into a full-stack app for **one solar installation company**.
Visitors size a system from their appliances and see its cost. Interested visitors sign up, an admin
assigns them to a staff rep, and the rep guides them through chat, video calls, a quote and a deposit
payment until installation is complete. Scope should stay simple, with a modern, premium UI.

## Product
- **Users and roles:** `customer` (homeowner/office), `rep` (company staff), `admin` (company owner/ops).
- **Main job:** turn calculator visitors into paying, onboarded customers.
- **Market:** Nigeria. All money is NGN, stored as integer kobo.
- **Out of scope for v1:** a marketplace or multiple installers, online balance or installment payments,
  multiple time zones or currencies, SMS/WhatsApp, a native mobile app, self-serve account deletion,
  product analytics.

## Core flows
1. **Visitor:** landing page → appliance calculator → full public results (panels, battery, inverter, NGN cost breakdown)
   → "Talk to an expert" → sign up (email+password or Google). The calculation held in the browser is saved to the account.
2. **Waiting:** the customer dashboard shows "Assigning your expert…". The admin's unassigned queue updates live (Neon Realtime),
   and the admin gets an email (Resend).
3. **Assigned:** the admin picks a rep. A Stream channel is created (customer + rep), and the customer gets an email. The dashboard updates live.
4. **Onboarding:** chat with reactions, replies and threads. Either side can start a 1:1 video call from the chat (ringing),
   or the customer books a slot from the rep's weekly availability. The customer uploads site photos and videos.
5. **Quote:** the rep builds a quote from the saved calculation and edits line items, then sends it. The customer accepts and pays
   the deposit (global admin %) through Paystack. The webhook confirms payment, and the stage moves to Deposit paid.
6. **Delivery:** the rep moves the stage forward (Site survey → Installation → Completed), uploads progress media, and marks
   the balance paid (paid offline). The customer sees a live progress tracker.
7. **Returning user:** signs in and lands on the dashboard for their role.

## Pages and routing
- **Public:** `/` (landing + calculator), `/sign-in`, `/sign-up`, `/invite/[token]`
- **Customer:** `/dashboard` (stage tracker, rep card, next call, quotes), `/dashboard/chat`,
  `/dashboard/quotes/[id]` (accept + pay), `/dashboard/book`, `/dashboard/media`
- **Rep:** `/rep` (my customers), `/rep/customers/[id]` (calculation, media, stage control, quote builder),
  `/rep/chat`, `/rep/availability`
- **Admin:** `/admin` (live unassigned queue + assign), `/admin/customers`, `/admin/reps` (invite),
  `/admin/pricing` (equipment, appliance catalog, settings such as deposit %)
- **Protection:** an edge check in Next's request proxy redirects signed-out users. Every server action and route handler
  re-checks the role **and** ownership (the proxy is never the only check).

## Data model (Neon Postgres)
| Entity | Key fields / rules |
|---|---|
| `profiles` | user_id (PK, the Neon Auth user), role, name, phone, address, `assigned_rep_id` → profiles, `stage` enum |
| `invites` | email, role, token_hash (unique), expires_at, accepted_at, invited_by |
| `appliances` | catalog: name, default_watts, icon, active |
| `equipment` | kind (panel/battery/inverter/install/accessory), spec (W / kWh / kVA), price_kobo, image (ImageKit), active |
| `settings` | single row: deposit_percent, peak_sun_hours, system_efficiency, battery_dod, inverter sizing factor |
| `calculations` | customer_id, inputs JSON (appliance lines, backup hours), results JSON, **price snapshot** |
| `quotes` / `quote_items` | status draft→sent→accepted→deposit_paid (or declined/cancelled); deposit % snapshot; locked once accepted |
| `payments` | quote_id, `paystack_reference` UNIQUE, amount_kobo, status, paid_at, raw event |
| `stage_events` | customer_id, from → to, changed_by, note, timestamp (an append-only history) |
| `availability_rules` | rep_id, weekday, start/end time (WAT) |
| `bookings` | customer_id, rep_id, starts_at, status, stream_call_id. Partial UNIQUE (rep_id, starts_at) where status='booked' |
| `reminders_sent` | booking_id, kind (24h/1h). UNIQUE together, which makes the cron safe to re-run |
| `media` | customer_id, uploaded_by, kind (site/progress/equipment/chat), imagekit_file_id, mime, size |

## Calculator (outage-backup sizing)
- **Inputs:** appliance lines (from the catalog or custom: quantity, watts, hours used) and the backup hours needed.
- **Outputs:** peak load → inverter kVA (rounded up to an available inverter); backup energy → battery kWh/units;
  recharge + daytime energy ÷ (sun hours × efficiency) → panel count. Cost uses the live equipment prices.
- All constants come from `settings` (editable by an admin). The formulas are finalized in the implementation plan.

## Architecture and integrations
- **Next.js 16 App Router:** server components for reads, server actions for mutations, route handlers for
  webhooks, cron and token endpoints. Tailwind + shadcn/ui, with light and dark mode.
- **Neon:** Postgres (dev branch + prod branch), Neon Auth (email+password, Google), and Neon Realtime (customer status and the admin queue only).
- **Stream:** Chat (channel per customer, members = customer + assigned rep) and Video (ring calls; scheduled calls for bookings).
  The server issues user tokens. Chat attachments go to ImageKit through a custom upload handler.
- **Paystack:** the server starts the deposit transaction. The webhook (HMAC-SHA512 verified) is the source of truth,
  and duplicate events are ignored because each payment reference is unique.
- **ImageKit:** the browser uploads directly with a token signed by our server. Customer media is private (signed URLs). Equipment images are public.
- **Resend:** about 6 app emails (new signup to admin, rep assigned, quote sent, payment received, booking confirmed, reminders, rep invite).
- **Sentry:** errors, tracing and session replay (inputs masked), plus Seer AI debugging if the plan allows. Source maps are uploaded at build.
- **Cron:** every 5 minutes it calls `/api/cron/reminders`, protected by a secret header. It runs on the Cloudways cron, or an external scheduler as a fallback.
- **Hosting:** Cloudways Velocity (managed Node.js), pinned to Node 24 LTS. GitHub `main` deploys to production.

## Delivery phases
1. Calculator rebuild + UI system + Neon DB/Auth + admin pricing + Sentry + deploy pipeline
2. Admin assignment + Neon Realtime status + Stream chat + ring video + Resend
3. Quotes + Paystack deposit + stage tracker
4. Rep availability + booking + reminders cron + ImageKit (all four upload types)

**Definition of done for v1:** on production with Paystack test mode, a test customer completes
calculator → signup → assigned → chat + video → book a call → upload media → quote → deposit → stages through to Completed.

## ASSUMPTIONS
- A1: Build on this repo and evolve the existing calculator.
- A2: Nigeria only, NGN only, a single time zone (Africa/Lagos).
- A3: The rep builds the quote from the saved calculation. Accepted quotes are locked, and a price change needs a new quote.
- A4: A calculation made before signup lives in localStorage until signup.
- A5: Booking uses 30-minute slots, only with the assigned rep, with cancel/reschedule allowed up to 2 hours before.
- A6: Roles and invites live in our own tables, not in Neon Auth plugins.
- A7: Upload limits are images ≤10MB and videos ≤100MB. Only metadata is stored in Neon.
- A8: Customer media is visible only to that customer, their rep and admins.
- A9: Drizzle ORM + Zod for schema, migrations and validation (libraries, not new services).
- A10: Reassigning a rep swaps the Stream channel member. Future bookings with the old rep are cancelled, and the customer is emailed.
- A11: Scale in year 1 is under 1,000 customers and under 20 reps. No CDN beyond Cloudways' built-in Cloudflare.
- A12: Account deletion is admin-run on request. Users are deactivated rather than hard-deleted, to keep payment history.
- A13: Testing is unit tests for the calculator math, the Paystack webhook and booking slots, plus a manual end-to-end checklist for each phase.
- A14: SEO covers only `/`: metadata, Open Graph image, sitemap and robots. All signed-in pages are noindex.
- A15: Basic rate limiting on the public save, upload-token and invite endpoints.

## OPEN RISKS
1. **Neon Auth (Managed Better Auth):** check which features are supported (Google, invites). If a needed feature is missing, roles stay in app tables (A6).
2. **Neon Realtime:** a newer product. Check its maturity, limits and pricing. Fallback: polling every 10–15 seconds.
3. **Cloudways Velocity:** only generally available since Sept 2026. Confirm the cron feature, build memory for Next 16, environment variables and Git deploy.
   Local development is on Node 26, but the server runs Node 24, so `engines` must be pinned.
4. **TypeScript 7** was installed by default. Some tooling (Sentry, ESLint plugins) may lag behind it. We may pin TS 5.x.
5. **Stream:** video minutes and active-user costs, plus the effort of routing chat attachments to ImageKit.
6. **Paystack:** live keys need business verification. Webhooks need a public HTTPS URL, so local testing needs a tunnel.
7. **ImageKit:** private files plus signed URLs, and video processing and size limits on the chosen plan.
8. **Sentry Seer** is a paid add-on and needs a GitHub-connected repo. This folder is not a git repo yet.
9. **Resend:** needs a verified sending domain (DNS access), and deliverability to Nigerian inboxes is a concern.
10. **Scope:** chat + video + self-booking + four upload types is substantial. Phasing mitigates this, and it's the first thing to cut if time slips.
11. **Privacy:** Nigeria's Data Protection Act (NDPA 2023) applies to addresses and home photos. We need a privacy policy, consent at signup and deletion on request.
12. **Calculator formulas** should be checked by a real installer before launch.
13. **Neon MCP plugin** is not authorized yet. Run `/mcp` to authorize it so Claude can provision Neon branches and Auth.
14. **Accounts needed:** Neon, Stream, Paystack, ImageKit, Sentry, Resend, Google OAuth client, Cloudways Velocity, GitHub.
