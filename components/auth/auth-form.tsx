"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, CalculatorIcon, EyeIcon, EyeOffIcon, HeadsetIcon, Loader2Icon, MailCheckIcon, ShieldIcon, UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { goldButton } from "@/components/shared/styles";

export type AuthView = "sign-in" | "sign-up" | "forgot-password";

export function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden className="size-4">
      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9Z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7Z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44Z" />
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9Z" />
    </svg>
  );
}

export function AuthForm({ view, fromCalculator }: { view: AuthView; fromCalculator?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [consent, setConsent] = useState(false);
  const [pw, setPw] = useState("");

  const strength = Math.min(4, [pw.length >= 8, /[A-Z]/.test(pw), /\d/.test(pw), /[^A-Za-z0-9]/.test(pw)].filter(Boolean).length);

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const next: Record<string, string> = {};
    const email = String(f.get("email") ?? "");
    if (!/^\S+@\S+\.\S+$/.test(email)) next.email = "Enter a valid email address.";
    if (view !== "forgot-password" && String(f.get("password") ?? "").length < 8) next.password = "Use at least 8 characters.";
    if (view === "sign-up" && String(f.get("name") ?? "").trim().length < 2) next.name = "Enter your full name.";
    if (view === "sign-up" && !consent) next.consent = "Please accept the privacy policy to continue.";
    setErrors(next);
    if (Object.keys(next).length) return;
    setLoading(true);
    setTimeout(() => {
      if (view === "forgot-password") {
        setLoading(false);
        setSent(true);
      } else router.push(view === "sign-up" ? "/dashboard?welcome=1" : "/dashboard");
    }, 900);
  };

  if (view === "forgot-password" && sent) {
    return (
      <div className="text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-gold-soft text-gold-text">
          <MailCheckIcon className="size-6" />
        </span>
        <h1 className="mt-5 font-display text-2xl font-extrabold">Check your inbox</h1>
        <p className="mt-2 text-sm text-muted-foreground">If an account exists for that email, we&apos;ve sent a code to reset your password. It expires in 15 minutes.</p>
        <Button asChild variant="outline" className="mt-6">
          <Link href="/auth/sign-in">
            <ArrowLeftIcon /> Back to sign in
          </Link>
        </Button>
      </div>
    );
  }

  const title = { "sign-in": "Welcome back", "sign-up": "Talk to a solar expert", "forgot-password": "Forgot your password?" }[view];
  const subtitle = {
    "sign-in": "Sign in to see your project, quote and messages.",
    "sign-up": "Create a free account. We'll match you with a dedicated advisor.",
    "forgot-password": "Enter your email and we'll send you a reset code.",
  }[view];

  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold tracking-tight">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>

      {view === "sign-up" && fromCalculator && (
        <div className="mt-5 flex gap-3 rounded-xl border border-gold/30 bg-gold-soft p-3 text-sm">
          <CalculatorIcon className="mt-0.5 size-4 shrink-0 text-gold-text" />
          <p>
            <span className="font-medium">Your estimate is ready to save.</span>{" "}
            <span className="text-muted-foreground">It&apos;ll be waiting on your dashboard for your advisor.</span>
          </p>
        </div>
      )}

      {view !== "forgot-password" && (
        <>
          <Button variant="outline" className="mt-6 h-11 w-full" onClick={() => router.push(view === "sign-up" ? "/dashboard?welcome=1" : "/dashboard")}>
            <GoogleIcon /> Continue with Google
          </Button>
          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or with email <span className="h-px flex-1 bg-border" />
          </div>
        </>
      )}

      <form onSubmit={submit} noValidate className={cn("space-y-4", view === "forgot-password" && "mt-6")}>
        {view === "sign-up" && (
          <FieldWrap id="name" label="Full name" error={errors.name}>
            <Input id="name" name="name" autoComplete="name" placeholder="Kemi Adeyemi" aria-invalid={!!errors.name} className="h-10" />
          </FieldWrap>
        )}
        <FieldWrap id="email" label="Email" error={errors.email}>
          <Input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" aria-invalid={!!errors.email} className="h-10" />
        </FieldWrap>
        {view === "sign-up" && (
          <FieldWrap id="phone" label="Phone (optional)">
            <div className="flex">
              <span className="grid place-items-center rounded-l-lg border border-r-0 bg-muted px-3 text-sm text-muted-foreground">+234</span>
              <Input id="phone" name="phone" type="tel" autoComplete="tel-national" placeholder="801 234 5678" className="h-10 rounded-l-none" />
            </div>
          </FieldWrap>
        )}
        {view !== "forgot-password" && (
          <FieldWrap
            id="password"
            label="Password"
            error={errors.password}
            extra={
              view === "sign-in" ? (
                <Link href="/auth/forgot-password" className="text-xs font-medium text-gold-text hover:underline">
                  Forgot password?
                </Link>
              ) : null
            }
          >
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPw ? "text" : "password"}
                autoComplete={view === "sign-up" ? "new-password" : "current-password"}
                aria-invalid={!!errors.password}
                className="h-10 pr-10"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
              />
              <Button type="button" variant="ghost" size="icon-sm" className="absolute top-1/2 right-1.5 -translate-y-1/2" onClick={() => setShowPw(!showPw)} aria-label={showPw ? "Hide password" : "Show password"}>
                {showPw ? <EyeOffIcon /> : <EyeIcon />}
              </Button>
            </div>
            {view === "sign-up" && pw && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex flex-1 gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <span key={i} className={cn("h-1 flex-1 rounded-full", i < strength ? (strength < 2 ? "bg-red-500" : strength < 4 ? "bg-amber-500" : "bg-emerald-500") : "bg-muted")} />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">{["Too weak", "Weak", "Okay", "Good", "Strong"][strength]}</span>
              </div>
            )}
          </FieldWrap>
        )}
        {view === "sign-up" && (
          <div>
            <div className="flex items-start gap-2.5">
              <Checkbox id="consent" checked={consent} onCheckedChange={(v) => setConsent(v === true)} className="mt-0.5" aria-invalid={!!errors.consent} />
              <Label htmlFor="consent" className="text-sm leading-snug font-normal text-muted-foreground">
                I agree to the{" "}
                <Link href="/privacy" className="font-medium text-gold-text hover:underline">
                  privacy policy
                </Link>{" "}
                and to being contacted about my solar project.
              </Label>
            </div>
            {errors.consent && <p className="mt-1.5 text-xs text-destructive">{errors.consent}</p>}
          </div>
        )}
        <Button type="submit" className={cn(goldButton, "h-11 w-full text-base")} disabled={loading}>
          {loading && <Loader2Icon className="animate-spin" />}
          {{ "sign-in": "Sign in", "sign-up": "Create account", "forgot-password": "Send reset code" }[view]}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {view === "sign-in" ? (
          <>
            New here?{" "}
            <Link href="/auth/sign-up" className="font-medium text-gold-text hover:underline">
              Create an account
            </Link>
          </>
        ) : (
          <>
            {view === "sign-up" ? "Already have an account? " : "Remembered it? "}
            <Link href="/auth/sign-in" className="font-medium text-gold-text hover:underline">
              Sign in
            </Link>
          </>
        )}
      </p>

      {view === "sign-in" && (
        <div className="mt-8 rounded-xl border border-dashed p-4">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Preview the app (demo)</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[
              { href: "/dashboard", label: "Customer", icon: UserIcon },
              { href: "/rep", label: "Advisor", icon: HeadsetIcon },
              { href: "/admin", label: "Admin", icon: ShieldIcon },
            ].map((d) => (
              <Button key={d.href} asChild variant="secondary" size="sm" className="h-9">
                <Link href={d.href}>
                  <d.icon /> {d.label}
                </Link>
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FieldWrap({ id, label, error, extra, children }: { id: string; label: string; error?: string; extra?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>{label}</Label>
        {extra}
      </div>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
