import type { Metadata } from "next";
import { QuoteIcon } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { HeroIllustration } from "@/components/marketing/hero-illustration";

export const metadata: Metadata = { robots: { index: false } };

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <aside className="dark relative hidden overflow-hidden bg-night p-10 text-foreground lg:flex lg:flex-col">
        <Logo />
        <div className="relative mt-auto">
          <h2 className="font-display text-5xl leading-[0.95] font-black tracking-tight uppercase">
            Start with
            <br />
            <span className="text-gold-gradient">your load.</span>
          </h2>
          <div className="gold-rule mt-5 w-16" />
          <HeroIllustration className="mt-8 w-full max-w-lg opacity-95" />
          <figure className="mt-8 max-w-md rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <QuoteIcon className="size-5 text-gold-text" />
            <blockquote className="mt-2 text-sm leading-relaxed text-muted-foreground">
              &ldquo;Our advisor walked us through everything on video before we paid a kobo. Two days later, we had power all night.&rdquo;
            </blockquote>
            <figcaption className="mt-3 text-sm font-medium">Adaora N. · Lekki, Lagos</figcaption>
          </figure>
        </div>
      </aside>
      <main className="flex flex-col">
        <div className="flex items-center justify-between p-4 sm:p-6">
          <div className="lg:invisible">
            <Logo />
          </div>
          <ThemeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center px-4 pb-12 sm:px-6">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </main>
    </div>
  );
}
