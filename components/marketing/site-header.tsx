"use client";

import Link from "next/link";
import { MenuIcon } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { goldButton } from "@/components/shared/styles";

const links = [
  { href: "/#calculator", label: "Calculator" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#system", label: "Your system" },
  { href: "/#faq", label: "FAQ" },
];

export function SiteHeader() {
  return (
    <header className="dark sticky top-0 z-50 border-b border-white/10 bg-black/90 text-foreground backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link href="/auth/sign-in">Sign in</Link>
          </Button>
          <Button asChild className={`${goldButton} hidden h-9 px-4 sm:inline-flex`}>
            <Link href="/#calculator">Get my estimate</Link>
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                <MenuIcon />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="dark w-72 bg-background text-foreground">
              <SheetHeader>
                <SheetTitle className="sr-only">Menu</SheetTitle>
                <Logo />
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-4" aria-label="Mobile">
                {links.map((l) => (
                  <Link key={l.href} href={l.href} className="rounded-md px-3 py-2.5 text-sm hover:bg-muted">
                    {l.label}
                  </Link>
                ))}
                <Link href="/auth/sign-in" className="rounded-md px-3 py-2.5 text-sm hover:bg-muted">
                  Sign in
                </Link>
                <Button asChild className={`${goldButton} mt-3 h-10`}>
                  <Link href="/#calculator">Get my estimate</Link>
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
