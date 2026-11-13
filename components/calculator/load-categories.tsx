"use client";

import { Building2Icon, CogIcon, FactoryIcon, HouseIcon, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LoadPreset } from "@/lib/mock-data";

export const loadCategoryIcons: Record<LoadPreset, LucideIcon> = {
  residential: HouseIcon,
  business: Building2Icon,
  industrial: FactoryIcon,
  specialized: CogIcon,
};

const items: { id: LoadPreset; label: [string, string] }[] = [
  { id: "residential", label: ["Residential", "loads"] },
  { id: "business", label: ["Business", "loads"] },
  { id: "industrial", label: ["Industrial", "loads"] },
  { id: "specialized", label: ["Specialized", "loads"] },
];

/** The four gold-ring load categories from the design reference. */
export function LoadCategories({
  value,
  onChange,
  className,
}: {
  value?: LoadPreset | null;
  onChange?: (v: LoadPreset) => void;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-2 sm:grid-cols-4", className)} role="radiogroup" aria-label="Load type">
      {items.map((it, i) => {
        const Icon = loadCategoryIcons[it.id];
        const active = value === it.id;
        return (
          <button
            key={it.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange?.(it.id)}
            className={cn(
              "group relative flex flex-col items-center gap-3 px-3 py-5 text-center transition",
              i > 0 && "sm:before:absolute sm:before:inset-y-4 sm:before:left-0 sm:before:w-px sm:before:bg-gradient-to-b sm:before:from-transparent sm:before:via-gold/40 sm:before:to-transparent",
            )}
          >
            <span
              className={cn(
                "grid size-16 place-items-center rounded-full border-2 transition",
                active
                  ? "border-transparent bg-gold-gradient text-black shadow-[0_0_40px_-6px_rgba(220,171,66,0.8)]"
                  : "border-gold/70 text-gold-text group-hover:border-gold group-hover:bg-gold-soft",
              )}
            >
              <Icon className="size-7" strokeWidth={1.6} />
            </span>
            <span className={cn("font-display text-xs leading-tight font-bold tracking-[0.12em] uppercase", active ? "text-gold-text" : "text-foreground/85")}>
              {it.label[0]}
              <br />
              {it.label[1]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
