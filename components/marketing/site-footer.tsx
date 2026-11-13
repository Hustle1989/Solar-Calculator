import Link from "next/link";
import { MailIcon, MapPinIcon, PhoneIcon } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { brand } from "@/lib/brand";

export function SiteFooter() {
  return (
    <footer className="dark border-t border-white/10 bg-[oklch(0.1_0.005_70)] text-foreground">
      <div className="gold-rule opacity-60" />
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">{brand.tagline}. Sized properly, priced honestly, installed by certified engineers.</p>
        </div>
        <FooterCol title="Product" links={[["/#calculator", "Load calculator"], ["/#how-it-works", "How it works"], ["/#system", "What's included"], ["/#faq", "FAQ"]]} />
        <FooterCol title="Account" links={[["/auth/sign-in", "Sign in"], ["/auth/sign-up", "Create account"], ["/privacy", "Privacy policy"]]} />
        <div>
          <p className="font-display text-xs font-bold tracking-[0.2em] uppercase">Talk to us</p>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><PhoneIcon className="size-4 text-gold-text" />{brand.phone}</li>
            <li className="flex items-center gap-2"><MailIcon className="size-4 text-gold-text" />{brand.email}</li>
            <li className="flex items-center gap-2"><MapPinIcon className="size-4 text-gold-text" />{brand.address}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:justify-between sm:px-6">
          <p>© 2026 {brand.name}. All rights reserved.</p>
          <p>Prices are estimates in Nigerian naira (₦) and are confirmed after a site survey.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <p className="font-display text-xs font-bold tracking-[0.2em] uppercase">{title}</p>
      <ul className="mt-4 space-y-2.5 text-sm">
        {links.map(([href, label]) => (
          <li key={href}>
            <Link href={href} className="text-muted-foreground transition hover:text-foreground">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
