import type { LucideIcon } from "lucide-react";
import { ImageIcon, PlayIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/format";
import { Avatar, AvatarFallback, AvatarBadge } from "@/components/ui/avatar";

export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
}: {
  title: string;
  description?: React.ReactNode;
  eyebrow?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1.5 font-display text-[0.7rem] font-bold tracking-[0.25em] text-gold-text uppercase">{eyebrow}</p>
        )}
        <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  highlight,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon: LucideIcon;
  highlight?: boolean;
}) {
  return (
    <div className={cn("relative overflow-hidden rounded-xl border bg-card p-4", highlight && "gold-border")}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
        <span className="grid size-8 place-items-center rounded-full border border-gold/30 bg-gold-soft text-gold-text">
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-2 font-display text-2xl font-bold tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center rounded-xl border border-dashed px-6 py-12 text-center", className)}>
      <span className="grid size-12 place-items-center rounded-full border border-gold/40 bg-gold-soft text-gold-text">
        <Icon className="size-5" />
      </span>
      <p className="mt-4 font-semibold">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function UserAvatar({
  name,
  online,
  className,
  gold,
  size,
}: {
  name: string;
  online?: boolean;
  className?: string;
  gold?: boolean;
  size?: "default" | "sm" | "lg";
}) {
  return (
    <Avatar className={className} size={size}>
      <AvatarFallback
        className={cn(
          "font-semibold",
          gold ? "bg-gold-gradient text-black" : "bg-secondary text-secondary-foreground",
        )}
      >
        {initials(name)}
      </AvatarFallback>
      {online !== undefined && (
        <AvatarBadge className={online ? "bg-emerald-500" : "bg-muted-foreground"} />
      )}
    </Avatar>
  );
}

/** Stand-in for an uploaded photo/video until ImageKit is wired in. */
export function MediaThumb({
  type,
  tone,
  className,
  label,
}: {
  type: "image" | "video" | "file";
  tone?: string;
  className?: string;
  label?: string;
}) {
  return (
    <div
      className={cn(
        "relative grid aspect-[4/3] place-items-center overflow-hidden rounded-lg bg-gradient-to-br text-white/70",
        tone ?? "from-zinc-700 to-zinc-900",
        className,
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.18),transparent_55%)]" />
      {type === "video" ? (
        <span className="grid size-10 place-items-center rounded-full bg-black/45 backdrop-blur">
          <PlayIcon className="size-4 fill-current" />
        </span>
      ) : (
        <ImageIcon className="size-6" />
      )}
      {label && <span className="absolute bottom-1.5 left-2 text-[0.65rem] font-medium text-white/80">{label}</span>}
    </div>
  );
}

export function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="font-display text-sm font-bold tracking-[0.12em] uppercase">{children}</h2>
      {action}
    </div>
  );
}
