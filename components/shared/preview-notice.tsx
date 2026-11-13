import { FlaskConicalIcon } from "lucide-react";

/** Marks screens that still show demo data until their phase is wired up. */
export function PreviewNotice({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-2 rounded-lg border border-dashed border-gold/40 bg-gold-soft/50 px-3 py-2 text-xs text-muted-foreground">
      <FlaskConicalIcon className="mt-0.5 size-3.5 shrink-0 text-gold-text" />
      <span>{children}</span>
    </p>
  );
}
