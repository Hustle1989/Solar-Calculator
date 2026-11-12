// UI-only phase: every screen reads hardcoded data from here. Replace with DB queries later.
import type { ApplianceLine, Equipment, SizingSettings } from "@/lib/calc/size-system";
import type { AvailabilityRule } from "@/lib/booking/slots";
import { lagosTime, lagosYmd } from "@/lib/booking/slots";
import type { Stage } from "@/lib/stages";

export type Role = "customer" | "rep" | "admin";

// ---------- time helpers (relative to today, Lagos time) ----------
const now = new Date();
const today = lagosYmd(now);
/** Lagos wall time `days` from today at hh:mm. */
export const at = (days: number, hh: number, mm = 0) => lagosTime(today.y, today.m, today.d + days, hh * 60 + mm);
const ago = (minutes: number) => new Date(now.getTime() - minutes * 60_000);

// ---------- pricing ----------
export const settings: SizingSettings = {
  depositPercent: 30,
  peakSunHours: 5,
  systemEfficiency: 0.8,
  batteryDod: 0.8,
  inverterEfficiency: 0.9,
  inverterSafetyFactor: 1.25,
  powerFactor: 0.8,
  installPercent: 0.1,
  accessoriesPercent: 0.08,
};

export const equipment: Equipment[] = [
  { id: "p-450", kind: "panel", name: "Mono PERC 450W", spec: 450, priceKobo: 13_500_000, active: true },
  { id: "p-550", kind: "panel", name: "Mono PERC 550W", spec: 550, priceKobo: 16_500_000, isDefault: true, active: true },
  { id: "p-600", kind: "panel", name: "Bifacial 600W", spec: 600, priceKobo: 19_500_000, active: false },
  { id: "b-5", kind: "battery", name: "LiFePO4 5kWh 48V", spec: 5, priceKobo: 135_000_000, isDefault: true, active: true },
  { id: "b-10", kind: "battery", name: "LiFePO4 10kWh 48V", spec: 10, priceKobo: 255_000_000, active: true },
  { id: "i-1.5", kind: "inverter", name: "Hybrid inverter 1.5kVA", spec: 1.5, priceKobo: 42_000_000, active: true },
  { id: "i-3.5", kind: "inverter", name: "Hybrid inverter 3.5kVA", spec: 3.5, priceKobo: 78_000_000, active: true },
  { id: "i-5", kind: "inverter", name: "Hybrid inverter 5kVA", spec: 5, priceKobo: 115_000_000, active: true },
  { id: "i-7.5", kind: "inverter", name: "Hybrid inverter 7.5kVA", spec: 7.5, priceKobo: 165_000_000, active: true },
  { id: "i-10", kind: "inverter", name: "Hybrid inverter 10kVA", spec: 10, priceKobo: 230_000_000, active: true },
  { id: "i-15", kind: "inverter", name: "Hybrid inverter 15kVA", spec: 15, priceKobo: 340_000_000, active: true },
];

// ---------- appliance catalog ----------
export type ApplianceCategory = "Cooling" | "Kitchen" | "Entertainment" | "Lighting" | "Office" | "Water & laundry" | "Security";
export type Appliance = { id: string; name: string; watts: number; hours: number; category: ApplianceCategory };

export const appliances: Appliance[] = [
  { id: "led", name: "LED bulb", watts: 10, hours: 8, category: "Lighting" },
  { id: "security-light", name: "Security light", watts: 30, hours: 12, category: "Lighting" },
  { id: "ceiling-fan", name: "Ceiling fan", watts: 75, hours: 10, category: "Cooling" },
  { id: "standing-fan", name: "Standing fan", watts: 60, hours: 8, category: "Cooling" },
  { id: "ac-1hp", name: "Air conditioner (1HP)", watts: 900, hours: 6, category: "Cooling" },
  { id: "ac-1.5hp", name: "Air conditioner (1.5HP)", watts: 1300, hours: 6, category: "Cooling" },
  { id: "ac-2hp", name: "Air conditioner (2HP)", watts: 1800, hours: 6, category: "Cooling" },
  { id: "fridge", name: "Refrigerator (medium)", watts: 150, hours: 24, category: "Kitchen" },
  { id: "freezer", name: "Deep freezer", watts: 200, hours: 24, category: "Kitchen" },
  { id: "microwave", name: "Microwave", watts: 1200, hours: 0.5, category: "Kitchen" },
  { id: "blender", name: "Blender", watts: 400, hours: 0.25, category: "Kitchen" },
  { id: "tv-32", name: "LED TV (32\")", watts: 50, hours: 6, category: "Entertainment" },
  { id: "tv-55", name: "LED TV (55\")", watts: 120, hours: 6, category: "Entertainment" },
  { id: "decoder", name: "Satellite decoder", watts: 25, hours: 6, category: "Entertainment" },
  { id: "sound", name: "Sound system", watts: 100, hours: 3, category: "Entertainment" },
  { id: "laptop", name: "Laptop", watts: 65, hours: 8, category: "Office" },
  { id: "desktop", name: "Desktop + monitor", watts: 250, hours: 8, category: "Office" },
  { id: "router", name: "Wi-Fi router", watts: 15, hours: 24, category: "Office" },
  { id: "printer", name: "Printer", watts: 50, hours: 1, category: "Office" },
  { id: "phone", name: "Phone charger", watts: 10, hours: 3, category: "Office" },
  { id: "pump", name: "Water pump (1HP)", watts: 750, hours: 1, category: "Water & laundry" },
  { id: "washer", name: "Washing machine", watts: 500, hours: 1, category: "Water & laundry" },
  { id: "iron", name: "Pressing iron", watts: 1000, hours: 0.5, category: "Water & laundry" },
  { id: "cctv", name: "CCTV system (4 cameras)", watts: 40, hours: 24, category: "Security" },
  { id: "gate", name: "Electric gate motor", watts: 300, hours: 0.5, category: "Security" },
];

const line = (id: string, qty: number, hours?: number): ApplianceLine => {
  const a = appliances.find((x) => x.id === id)!;
  return { id: `${id}-${qty}-${hours ?? a.hours}`, name: a.name, qty, watts: a.watts, hoursPerDay: hours ?? a.hours };
};

export type LoadPreset = "residential" | "business" | "industrial" | "specialized";
export const loadPresets: Record<LoadPreset, { label: string; blurb: string; backupHours: number; lines: ApplianceLine[] }> = {
  residential: {
    label: "Residential loads",
    blurb: "Homes, duplexes and apartments",
    backupHours: 10,
    lines: [line("led", 12), line("ceiling-fan", 4), line("fridge", 1), line("tv-55", 1), line("decoder", 1), line("router", 1), line("laptop", 2), line("phone", 4)],
  },
  business: {
    label: "Business loads",
    blurb: "Offices, shops and clinics",
    backupHours: 9,
    lines: [line("led", 20), line("ac-1.5hp", 2, 6), line("desktop", 6), line("printer", 2), line("router", 1), line("cctv", 1), line("ceiling-fan", 4)],
  },
  industrial: {
    label: "Industrial loads",
    blurb: "Workshops, cold rooms and light industry",
    backupHours: 8,
    lines: [line("security-light", 10), line("freezer", 4), line("pump", 2, 2), line("ac-2hp", 2, 6), line("desktop", 3), line("cctv", 2)],
  },
  specialized: {
    label: "Specialized loads",
    blurb: "Schools, churches, estates and more",
    backupHours: 6,
    lines: [line("led", 30), line("ceiling-fan", 10), line("sound", 2, 4), line("tv-55", 2, 4), line("cctv", 2), line("pump", 1, 2)],
  },
};

// ---------- people ----------
export type Rep = { id: string; name: string; email: string; phone: string; title: string; status: "active" | "invited" | "deactivated"; online: boolean; joined: Date };

export const reps: Rep[] = [
  { id: "r-1", name: "Tunde Bakare", email: "tunde@example.com", phone: "+234 801 234 5678", title: "Senior Solar Advisor", status: "active", online: true, joined: at(-420, 9) },
  { id: "r-2", name: "Adaeze Okafor", email: "adaeze@example.com", phone: "+234 802 345 6789", title: "Solar Advisor", status: "active", online: true, joined: at(-210, 9) },
  { id: "r-3", name: "Chiamaka Eze", email: "chiamaka@example.com", phone: "+234 803 456 7890", title: "Solar Advisor", status: "active", online: false, joined: at(-95, 9) },
  { id: "r-4", name: "Ibrahim Musa", email: "ibrahim@example.com", phone: "", title: "Solar Advisor", status: "invited", online: false, joined: at(-2, 9) },
];

export const admin = { id: "a-1", name: "Folake Adewale", email: "folake@example.com", title: "Operations Lead" };

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  address: string;
  propertyType: "Home" | "Office" | "Shop" | "Warehouse" | "School";
  stage: Stage;
  repId: string | null;
  signedUp: Date;
  systemKva: number;
  estimateKobo: number;
  lastActivity: Date;
};

export const customers: Customer[] = [
  { id: "c-1001", name: "Kemi Adeyemi", email: "kemi@example.com", phone: "+234 809 111 2222", city: "Lagos", address: "14 Admiralty Way, Lekki Phase 1", propertyType: "Home", stage: "quote_sent", repId: "r-1", signedUp: at(-9, 11), systemKva: 5, estimateKobo: 712_420_000, lastActivity: ago(18) },
  { id: "c-1002", name: "Emeka Nwosu", email: "emeka@example.com", phone: "+234 809 222 3333", city: "Abuja", address: "Plot 22, Gwarinpa Estate", propertyType: "Home", stage: "installation", repId: "r-1", signedUp: at(-34, 10), systemKva: 7.5, estimateKobo: 1_046_800_000, lastActivity: ago(140) },
  { id: "c-1003", name: "Zainab Bello", email: "zainab@example.com", phone: "+234 809 333 4444", city: "Kano", address: "8 Bompai Road", propertyType: "Shop", stage: "deposit_paid", repId: "r-2", signedUp: at(-16, 15), systemKva: 3.5, estimateKobo: 418_900_000, lastActivity: ago(300) },
  { id: "c-1004", name: "Oluwaseun Ajayi", email: "seun@example.com", phone: "+234 809 444 5555", city: "Ibadan", address: "5 Ring Road, Challenge", propertyType: "Office", stage: "site_survey", repId: "r-2", signedUp: at(-22, 9), systemKva: 10, estimateKobo: 1_520_000_000, lastActivity: ago(60 * 26) },
  { id: "c-1005", name: "Grace Effiong", email: "grace@example.com", phone: "+234 809 555 6666", city: "Port Harcourt", address: "31 Woji Road, GRA Phase 2", propertyType: "Home", stage: "assigned", repId: "r-3", signedUp: at(-3, 13), systemKva: 5, estimateKobo: 689_000_000, lastActivity: ago(95) },
  { id: "c-1006", name: "Chinedu Okeke", email: "chinedu@example.com", phone: "+234 809 666 7777", city: "Enugu", address: "12 Independence Layout", propertyType: "Warehouse", stage: "completed", repId: "r-1", signedUp: at(-80, 10), systemKva: 15, estimateKobo: 2_480_000_000, lastActivity: ago(60 * 24 * 6) },
  { id: "c-1007", name: "Halima Yusuf", email: "halima@example.com", phone: "+234 809 777 8888", city: "Lagos", address: "3 Bourdillon Road, Ikoyi", propertyType: "Home", stage: "new", repId: null, signedUp: ago(12), systemKva: 7.5, estimateKobo: 1_012_000_000, lastActivity: ago(12) },
  { id: "c-1008", name: "Babatunde Ogunleye", email: "tunde.o@example.com", phone: "+234 809 888 9999", city: "Lagos", address: "21 Allen Avenue, Ikeja", propertyType: "Office", stage: "new", repId: null, signedUp: ago(47), systemKva: 10, estimateKobo: 1_498_000_000, lastActivity: ago(47) },
  { id: "c-1009", name: "Ngozi Umeh", email: "ngozi@example.com", phone: "+234 809 999 0000", city: "Asaba", address: "7 Nnebisi Road", propertyType: "School", stage: "new", repId: null, signedUp: ago(60 * 5), systemKva: 15, estimateKobo: 2_210_000_000, lastActivity: ago(60 * 5) },
  { id: "c-1010", name: "Ifeoma Chukwu", email: "ifeoma@example.com", phone: "+234 808 123 4567", city: "Abuja", address: "40 Aminu Kano Crescent, Wuse 2", propertyType: "Home", stage: "quote_sent", repId: "r-3", signedUp: at(-6, 12), systemKva: 3.5, estimateKobo: 402_300_000, lastActivity: ago(60 * 8) },
  { id: "c-1011", name: "Musa Danjuma", email: "musa@example.com", phone: "+234 808 234 5678", city: "Kaduna", address: "2 Ahmadu Bello Way", propertyType: "Shop", stage: "assigned", repId: "r-2", signedUp: at(-2, 16), systemKva: 3.5, estimateKobo: 395_000_000, lastActivity: ago(60 * 3) },
];

export const DEMO_CUSTOMER_ID = "c-1001";
export const DEMO_REP_ID = "r-1";

export const getCustomer = (id: string) => customers.find((c) => c.id === id);
export const getRep = (id: string | null) => reps.find((r) => r.id === id);

// ---------- the demo customer's saved calculation ----------
export const demoCalculation = {
  id: "calc-1",
  createdAt: at(-9, 11),
  backupHours: 6,
  lines: [line("led", 14), line("ceiling-fan", 5), line("fridge", 1), line("tv-55", 1), line("decoder", 1), line("router", 1), line("laptop", 2), line("ac-1hp", 1, 4), line("pump", 1, 1)],
};

// ---------- quotes ----------
export type QuoteStatus = "draft" | "sent" | "accepted" | "deposit_paid" | "declined" | "cancelled";
export type QuoteItem = { id: string; description: string; qty: number; unitKobo: number };
export type Quote = {
  id: string;
  number: string;
  customerId: string;
  repId: string;
  status: QuoteStatus;
  items: QuoteItem[];
  installPercent: number;
  depositPercent: number;
  createdAt: Date;
  validUntil: Date;
  note: string;
};

export const quotes: Quote[] = [
  {
    id: "q-1042",
    number: "Q-1042",
    customerId: "c-1001",
    repId: "r-1",
    status: "sent",
    items: [
      { id: "qi-1", description: "Mono PERC 550W solar panel", qty: 10, unitKobo: 16_500_000 },
      { id: "qi-2", description: "LiFePO4 5kWh 48V battery", qty: 3, unitKobo: 135_000_000 },
      { id: "qi-3", description: "Hybrid inverter 5kVA", qty: 1, unitKobo: 115_000_000 },
      { id: "qi-4", description: "Roof mounting rails & clamps", qty: 1, unitKobo: 18_500_000 },
      { id: "qi-5", description: "DC/AC cabling, breakers & surge protection", qty: 1, unitKobo: 26_000_000 },
    ],
    installPercent: 0.1,
    depositPercent: 30,
    createdAt: at(-2, 14),
    validUntil: at(12, 23),
    note: "Includes a 4-hour site survey, installation and commissioning. Panels carry a 25-year performance warranty; batteries 10 years.",
  },
];

export const quoteTotals = (q: Pick<Quote, "items" | "installPercent" | "depositPercent">) => {
  const subtotal = q.items.reduce((t, i) => t + i.qty * i.unitKobo, 0);
  const installation = Math.round(subtotal * q.installPercent);
  const total = subtotal + installation;
  return { subtotal, installation, total, deposit: Math.round((total * q.depositPercent) / 100), balance: total - Math.round((total * q.depositPercent) / 100) };
};

// ---------- stage history ----------
export const demoStageEvents: { stage: Stage; at: Date; by: string; note?: string }[] = [
  { stage: "new", at: at(-9, 11), by: "Kemi Adeyemi" },
  { stage: "assigned", at: at(-9, 15), by: "Folake Adewale", note: "Assigned to Tunde Bakare" },
  { stage: "quote_sent", at: at(-2, 14), by: "Tunde Bakare", note: "Quote Q-1042 sent" },
];

// ---------- chat ----------
export type Reaction = { emoji: string; by: string[] };
export type Attachment = { kind: "image" | "video" | "file"; name: string; size: string; tone?: string };
export type Message = {
  id: string;
  authorId: string;
  text: string;
  at: Date;
  reactions?: Reaction[];
  attachments?: Attachment[];
  replies?: Message[];
  system?: { kind: "quote" | "booking" | "stage"; title: string; href?: string };
};

export const people: Record<string, { name: string; role: Role }> = {
  ...Object.fromEntries(customers.map((c) => [c.id, { name: c.name, role: "customer" as const }])),
  ...Object.fromEntries(reps.map((r) => [r.id, { name: r.name, role: "rep" as const }])),
  [admin.id]: { name: admin.name, role: "admin" },
};

export const conversations: Record<string, Message[]> = {
  "c-1001": [
    { id: "m1", authorId: "r-1", text: "Hi Kemi 👋 I'm Tunde, your solar advisor. I've gone through your calculation: a 5kVA system with about 15kWh of storage fits your home really well.", at: at(-9, 15, 20) },
    { id: "m2", authorId: "c-1001", text: "Hi Tunde! Thanks. My main worry is the AC at night. Will the batteries handle it?", at: at(-9, 15, 34), reactions: [{ emoji: "👍", by: ["r-1"] }] },
    {
      id: "m3",
      authorId: "r-1",
      text: "Good question. With 3 × 5kWh LiFePO4 batteries you can run the 1HP AC for about 4 hours plus your fridge, fans and lights through a 6-hour outage.",
      at: at(-9, 15, 41),
      replies: [
        { id: "m3r1", authorId: "c-1001", text: "And if I want the AC for the full night?", at: at(-9, 15, 50) },
        { id: "m3r2", authorId: "r-1", text: "We'd add a 4th battery (~₦1.35M). I can include it as an optional line on the quote.", at: at(-9, 15, 58), reactions: [{ emoji: "🙏", by: ["c-1001"] }] },
      ],
    },
    { id: "m4", authorId: "r-1", text: "Could you send a few photos of your roof and your meter/distribution board? It helps me plan the mounting without a visit.", at: at(-8, 10, 5) },
    {
      id: "m5",
      authorId: "c-1001",
      text: "Here you go, roof from the back and the DB in the garage.",
      at: at(-8, 12, 30),
      attachments: [
        { kind: "image", name: "roof-back.jpg", size: "2.4 MB", tone: "from-sky-900 to-slate-800" },
        { kind: "image", name: "distribution-board.jpg", size: "1.8 MB", tone: "from-zinc-700 to-stone-900" },
      ],
      reactions: [{ emoji: "🔥", by: ["r-1"] }, { emoji: "👍", by: ["r-1"] }],
    },
    { id: "m6", authorId: "r-1", text: "Perfect, the south-facing slope is ideal. Quote coming shortly.", at: at(-8, 12, 44), reactions: [{ emoji: "❤️", by: ["c-1001"] }] },
    { id: "m7", authorId: "system", text: "", at: at(-2, 14), system: { kind: "quote", title: "Quote Q-1042 sent · ₦8,024,500", href: "/dashboard/quotes/q-1042" } },
    { id: "m8", authorId: "r-1", text: "Your quote is ready! Have a look and let me know if you'd like to hop on a video call to walk through it.", at: at(-2, 14, 2) },
    { id: "m9", authorId: "c-1001", text: "Looks great. Booked a call for later this week so my husband can join 🙂", at: ago(18) },
  ],
  "c-1005": [
    { id: "g1", authorId: "r-3", text: "Hello Grace, I'm Chiamaka. Welcome! When's a good time for a quick call?", at: ago(60 * 20) },
    { id: "g2", authorId: "c-1005", text: "Tomorrow afternoon works. Thanks!", at: ago(95) },
  ],
  "c-1002": [
    { id: "e1", authorId: "r-1", text: "Installation crew arrives Thursday 9am. Please make sure the roof access is clear.", at: ago(60 * 26) },
    { id: "e2", authorId: "c-1002", text: "Noted, we'll be ready.", at: ago(140), reactions: [{ emoji: "👍", by: ["r-1"] }] },
  ],
  "c-1006": [
    { id: "x1", authorId: "c-1006", text: "System has been running perfectly for a week. Thank you!", at: ago(60 * 24 * 6), reactions: [{ emoji: "❤️", by: ["r-1"] }] },
  ],
};

// ---------- bookings & availability ----------
export type Booking = { id: string; customerId: string; repId: string; startsAt: Date; status: "booked" | "cancelled" | "completed"; topic: string };

export const bookings: Booking[] = [
  { id: "bk-1", customerId: "c-1001", repId: "r-1", startsAt: at(2, 11), status: "booked", topic: "Walk through quote Q-1042" },
  { id: "bk-2", customerId: "c-1002", repId: "r-1", startsAt: at(1, 15, 30), status: "booked", topic: "Pre-installation check" },
  { id: "bk-3", customerId: "c-1006", repId: "r-1", startsAt: at(3, 10), status: "booked", topic: "Post-installation review" },
  { id: "bk-4", customerId: "c-1001", repId: "r-1", startsAt: at(-8, 16), status: "completed", topic: "Introductory call" },
];

export const availability: AvailabilityRule[] = [
  { weekday: 1, start: "09:00", end: "17:00" },
  { weekday: 2, start: "09:00", end: "17:00" },
  { weekday: 3, start: "09:00", end: "13:00" },
  { weekday: 4, start: "09:00", end: "17:00" },
  { weekday: 5, start: "10:00", end: "16:00" },
  { weekday: 6, start: "10:00", end: "13:00" },
];

// ---------- media ----------
export type MediaItem = {
  id: string;
  kind: "site" | "progress";
  type: "image" | "video";
  title: string;
  stage?: Stage;
  uploadedBy: string;
  at: Date;
  size: string;
  tone: string;
};

export const media: MediaItem[] = [
  { id: "md1", kind: "site", type: "image", title: "Roof: back view", uploadedBy: "c-1001", at: at(-8, 12, 30), size: "2.4 MB", tone: "from-sky-900 via-slate-800 to-slate-950" },
  { id: "md2", kind: "site", type: "image", title: "Distribution board", uploadedBy: "c-1001", at: at(-8, 12, 30), size: "1.8 MB", tone: "from-zinc-700 via-stone-800 to-stone-950" },
  { id: "md3", kind: "site", type: "video", title: "Walkthrough: rooftop", uploadedBy: "c-1001", at: at(-8, 12, 34), size: "38 MB", tone: "from-amber-900 via-stone-800 to-black" },
  { id: "md4", kind: "site", type: "image", title: "Electricity meter", uploadedBy: "c-1001", at: at(-7, 9, 10), size: "1.1 MB", tone: "from-emerald-950 via-zinc-800 to-black" },
  { id: "md5", kind: "progress", type: "image", title: "Survey: roof measurements", stage: "site_survey", uploadedBy: "r-1", at: at(-1, 13), size: "3.2 MB", tone: "from-indigo-950 via-slate-800 to-black" },
];

// ---------- notifications & activity ----------
export type Notification = { id: string; title: string; body: string; at: Date; unread: boolean; href: string };

export const notifications: Record<Role, Notification[]> = {
  customer: [
    { id: "n1", title: "Your quote is ready", body: "Tunde sent quote Q-1042 for ₦8,024,500.", at: at(-2, 14), unread: true, href: "/dashboard/quotes/q-1042" },
    { id: "n2", title: "Call booked", body: "Video call with Tunde, in 2 days at 11:00 AM.", at: ago(18), unread: true, href: "/dashboard/book" },
    { id: "n3", title: "Expert assigned", body: "Tunde Bakare is your solar advisor.", at: at(-9, 15), unread: false, href: "/dashboard/chat" },
  ],
  rep: [
    { id: "n4", title: "New message from Kemi", body: "Booked a call for later this week…", at: ago(18), unread: true, href: "/rep/chat" },
    { id: "n5", title: "Call booked", body: "Kemi Adeyemi booked a call in 2 days at 11:00 AM.", at: ago(18), unread: true, href: "/rep/availability" },
    { id: "n6", title: "New customer assigned", body: "Grace Effiong was assigned to Chiamaka.", at: at(-3, 14), unread: false, href: "/rep" },
  ],
  admin: [
    { id: "n7", title: "New sign-up", body: "Halima Yusuf is waiting for an advisor.", at: ago(12), unread: true, href: "/admin" },
    { id: "n8", title: "New sign-up", body: "Babatunde Ogunleye is waiting for an advisor.", at: ago(47), unread: true, href: "/admin" },
    { id: "n9", title: "Deposit received", body: "Zainab Bello paid ₦1,256,700.", at: at(-1, 10), unread: false, href: "/admin/customers" },
  ],
};

export const activity = [
  { id: "a1", text: "Halima Yusuf signed up from the calculator", at: ago(12), kind: "signup" as const },
  { id: "a2", text: "Kemi Adeyemi booked a call with Tunde Bakare", at: ago(18), kind: "booking" as const },
  { id: "a3", text: "Babatunde Ogunleye signed up from the calculator", at: ago(47), kind: "signup" as const },
  { id: "a4", text: "Ngozi Umeh signed up from the calculator", at: ago(60 * 5), kind: "signup" as const },
  { id: "a5", text: "Zainab Bello paid a ₦1,256,700 deposit", at: at(-1, 10), kind: "payment" as const },
  { id: "a6", text: "Tunde Bakare sent quote Q-1042 to Kemi Adeyemi", at: at(-2, 14), kind: "quote" as const },
];

export const depositsCollectedKobo = 125_670_000 + 314_040_000 + 456_000_000 + 744_000_000;
