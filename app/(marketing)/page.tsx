import Link from "next/link";
import {
  ArrowRightIcon,
  BadgeCheckIcon,
  BatteryChargingIcon,
  CableIcon,
  CalculatorIcon,
  CreditCardIcon,
  HeadsetIcon,
  QuoteIcon,
  ShieldCheckIcon,
  StarIcon,
  SunIcon,
  WrenchIcon,
  ZapIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Calculator } from "@/components/calculator/calculator";
import { HeroIllustration } from "@/components/marketing/hero-illustration";
import { goldButton, eyebrow } from "@/components/shared/styles";
import { appliances, equipment, settings } from "@/lib/mock-data";

const steps = [
  { icon: CalculatorIcon, title: "Calculate your load", body: "List the appliances you need during an outage. We size the inverter, panels and batteries instantly." },
  { icon: HeadsetIcon, title: "Talk to an expert", body: "A dedicated solar advisor reviews your numbers with you over chat or a video call." },
  { icon: CreditCardIcon, title: "Approve your quote", body: "Get a detailed quote in naira. Pay a 30% deposit securely online to book your installation." },
  { icon: WrenchIcon, title: "Get installed", body: "Certified engineers survey, install and commission your system. Track every step live." },
];

const kit = [
  { icon: SunIcon, title: "Solar panels", body: "Tier-1 monocrystalline panels with 25-year performance warranties." },
  { icon: ZapIcon, title: "Hybrid inverter", body: "Pure sine-wave output that runs ACs, pumps and sensitive electronics." },
  { icon: BatteryChargingIcon, title: "Lithium batteries", body: "LiFePO4 storage rated for 6,000+ cycles: over 15 years of nightly use." },
  { icon: CableIcon, title: "Protection & cabling", body: "Surge protection, breakers and properly rated cabling. No shortcuts." },
];

const testimonials = [
  { name: "Adaora N.", place: "Lekki, Lagos", quote: "The calculator was spot on. Our 5kVA system runs the whole house, including one AC, right through the night." },
  { name: "Ibrahim K.", place: "Wuse 2, Abuja", quote: "Our advisor answered every question on video before we paid a kobo. Installation took two days." },
  { name: "Mrs. Oyelaran", place: "Bodija, Ibadan", quote: "Our clinic hasn't lost power since. Watching each stage update in the app gave us real peace of mind." },
];

const faqs = [
  { q: "How accurate is the estimate?", a: "It uses the same sizing method our engineers use, with current equipment prices. The final price is confirmed after a free site survey, usually within ±10% of the estimate." },
  { q: "What does the 30% deposit cover?", a: "The deposit reserves your equipment and installation date. The balance is paid after installation and commissioning." },
  { q: "Can the system run my air conditioner?", a: "Yes, if the inverter and batteries are sized for it. Add your AC in the calculator with realistic hours and the system will be sized to match." },
  { q: "How long does installation take?", a: "Most homes are installed in one to two days after the site survey. Larger commercial systems take three to five days." },
  { q: "Do I need to be connected to the grid?", a: "No. Our hybrid systems work with or without grid power. During outages, your batteries take over automatically." },
];

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <section className="dark relative overflow-hidden bg-night text-foreground">
        <div className="pointer-events-none absolute inset-0 bg-grid-faint [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 pt-14 pb-10 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:pt-20 lg:pb-16">
          <div>
            <p className={eyebrow}>Solar sizing &amp; installation · Nigeria</p>
            <h1 className="mt-5 font-display text-[2.6rem] leading-[0.95] font-black tracking-tight uppercase sm:text-6xl xl:text-7xl">
              Choosing solar?
              <br />
              <span className="text-gold-gradient">Know your load.</span>
              <br />
              <span className="text-[0.62em] tracking-normal">Own your power.</span>
            </h1>
            <div className="gold-rule mt-6 w-20" />
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              Size the right system for your home or business in two minutes: panels, batteries and inverter, priced
              in naira. Then a dedicated expert guides you all the way to installation.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild className={`${goldButton} h-12 px-7 text-base`}>
                <Link href="#calculator">
                  Calculate my system <ArrowRightIcon />
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-12 border-white/20 bg-white/5 px-7 text-base hover:bg-white/10">
                <Link href="/auth/sign-up">Talk to an expert</Link>
              </Button>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {["Free site survey", "Prices in naira", "Certified engineers"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <BadgeCheckIcon className="size-4 text-gold-text" /> {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="relative">
            <div className="absolute -inset-10 rounded-full bg-[radial-gradient(circle,rgba(220,171,66,0.18),transparent_65%)] blur-2xl" />
            <HeroIllustration className="relative w-full drop-shadow-2xl" />
          </div>
        </div>
        <div className="relative border-t border-white/10 bg-black/30">
          <dl className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-6 sm:px-6 md:grid-cols-4">
            {[
              ["1,200+", "Systems installed"],
              ["18 MW", "Solar capacity deployed"],
              ["24/7", "Backup with lithium storage"],
              ["4.9★", "Average customer rating"],
            ].map(([v, l]) => (
              <div key={l}>
                <dt className="sr-only">{l}</dt>
                <dd className="font-display text-2xl font-extrabold text-gold-gradient sm:text-3xl">{v}</dd>
                <p className="mt-1 text-xs tracking-wide text-muted-foreground uppercase">{l}</p>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* CALCULATOR */}
      <Calculator catalog={equipment} settings={settings} appliances={appliances} />

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="scroll-mt-20 border-y bg-muted/30 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <p className={eyebrow}>How it works</p>
            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight uppercase sm:text-4xl">
              From estimate to <span className="text-gold-gradient">switch-on</span>
            </h2>
          </div>
          <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <li key={s.title} className="group relative rounded-2xl border bg-card p-6 transition hover:-translate-y-1 hover:shadow-xl">
                <span className="font-display text-5xl font-black text-gold-gradient opacity-90">0{i + 1}</span>
                <s.icon className="absolute top-6 right-6 size-6 text-muted-foreground transition group-hover:text-gold-text" />
                <h3 className="mt-4 font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* YOUR SYSTEM */}
      <section id="system" className="dark scroll-mt-20 bg-night py-20 text-foreground sm:py-28">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className={eyebrow}>What&apos;s in your system</p>
            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight uppercase sm:text-4xl">
              Premium components. <span className="text-gold-gradient">Zero guesswork.</span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              Every quote lists exact models, quantities and prices, so you know what you&apos;re paying for. Equipment is
              warrantied and installed to standard by our own engineers.
            </p>
            <ul className="mt-6 space-y-2 text-sm">
              {["25-year panel performance warranty", "10-year battery warranty", "12-month workmanship guarantee"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <ShieldCheckIcon className="size-4 text-gold-text" /> {t}
                </li>
              ))}
            </ul>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {kit.map((k) => (
              <div key={k.title} className="gold-border rounded-2xl p-6">
                <span className="grid size-12 place-items-center rounded-full border-2 border-gold/70 text-gold-text">
                  <k.icon className="size-5" />
                </span>
                <h3 className="mt-4 font-display font-bold tracking-wide uppercase">{k.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{k.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center">
            <p className={eyebrow}>Customer stories</p>
            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight uppercase sm:text-4xl">Power that stays on</h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <figure key={t.name} className="rounded-2xl border bg-card p-6">
                <div className="flex gap-0.5 text-gold">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <StarIcon key={i} className="size-4 fill-current" />
                  ))}
                </div>
                <QuoteIcon className="mt-4 size-6 text-gold-text/50" />
                <blockquote className="mt-2 text-sm leading-relaxed">{t.quote}</blockquote>
                <figcaption className="mt-5 text-sm">
                  <span className="font-semibold">{t.name}</span>
                  <span className="text-muted-foreground"> · {t.place}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-20 border-t bg-muted/30 py-20 sm:py-28">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className={eyebrow}>FAQ</p>
            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight uppercase sm:text-4xl">Good questions</h2>
            <p className="mt-4 text-muted-foreground">Still unsure? Create an account and ask your advisor directly. It&apos;s free.</p>
          </div>
          <Accordion type="single" collapsible className="rounded-2xl border bg-card px-5">
            {faqs.map((f, i) => (
              <AccordionItem key={f.q} value={`f${i}`}>
                <AccordionTrigger className="text-base">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="dark bg-night py-20 text-foreground">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="font-display text-3xl font-black tracking-tight uppercase sm:text-5xl">
            Ready for <span className="text-gold-gradient">uninterrupted power?</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Get your estimate in two minutes, then talk it through with an expert. No obligation.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild className={`${goldButton} h-12 px-7 text-base`}>
              <Link href="#calculator">Start with your load</Link>
            </Button>
            <Button asChild variant="outline" className="h-12 border-white/20 bg-white/5 px-7 text-base hover:bg-white/10">
              <Link href="/auth/sign-in">I already have an account</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
