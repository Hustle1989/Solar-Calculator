import Link from "next/link";
import { cn } from "@/lib/utils";
import { brand } from "@/lib/brand";

/**
 * Shared SVG gradient, rendered once in the root layout. Defining it inside each logo breaks on mobile:
 * the first copy lives in the hidden desktop sidebar, and gradients inside display:none don't paint.
 */
export function BrandSvgDefs() {
  return (
    <svg aria-hidden width="0" height="0" className="pointer-events-none absolute">
      <defs>
        <linearGradient id="logo-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f8e08e" />
          <stop offset="0.5" stopColor="#dcab42" />
          <stop offset="1" stopColor="#a87923" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden className={cn("size-9", className)}>
      {/* rising sun */}
      <path d="M10 27a14 14 0 0 1 28 0Z" fill="url(#logo-gold)" />
      {[-60, -30, 0, 30, 60].map((deg) => (
        <rect
          key={deg}
          x="23"
          y="3"
          width="2"
          height="6"
          rx="1"
          fill="url(#logo-gold)"
          transform={`rotate(${deg} 24 27)`}
        />
      ))}
      {/* panel rows */}
      <path d="M6 31h36l-3 5H9Z" fill="url(#logo-gold)" />
      <path d="M10 38.5h28l-2.4 4.5H12.4Z" fill="url(#logo-gold)" opacity=".75" />
    </svg>
  );
}

export function Logo({ className, href = "/", compact = false }: { className?: string; href?: string; compact?: boolean }) {
  return (
    <Link href={href} className={cn("group inline-flex items-center gap-2.5", className)} aria-label={`${brand.name} home`}>
      <LogoMark />
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-[1.05rem] font-extrabold tracking-[0.22em] text-gold-gradient">
            {brand.wordmarkTop}
          </span>
          <span className="mt-1 font-display text-[0.58rem] font-semibold tracking-[0.42em] text-muted-foreground">
            {brand.wordmarkBottom}
          </span>
        </span>
      )}
    </Link>
  );
}
