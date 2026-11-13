// Money is always integer kobo. Times are always shown in Lagos time.
export const TIME_ZONE = "Africa/Lagos";

const nairaFmt = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 });
const nairaCompactFmt = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  notation: "compact",
  maximumFractionDigits: 2,
});

export const naira = (kobo: number) => nairaFmt.format(Math.round(kobo / 100));
export const nairaCompact = (kobo: number) => nairaCompactFmt.format(kobo / 100);
export const kobo = (nairaAmount: number) => Math.round(nairaAmount * 100);

export const formatNumber = (n: number, digits = 0) =>
  new Intl.NumberFormat("en-NG", { maximumFractionDigits: digits }).format(n);

export function formatDate(d: Date, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: TIME_ZONE, ...opts }).format(d);
}

export const formatTime = (d: Date) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: TIME_ZONE, hour: "numeric", minute: "2-digit", hour12: true }).format(d);

export const formatDay = (d: Date) => formatDate(d, { weekday: "short", day: "numeric", month: "short" });

export const formatDateTime = (d: Date) => `${formatDay(d)} · ${formatTime(d)}`;

export function timeAgo(d: Date, now = new Date()) {
  const s = Math.round((now.getTime() - d.getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.round(h / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(d, { day: "numeric", month: "short" });
}

export const initials = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
