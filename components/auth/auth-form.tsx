"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeftIcon, CalculatorIcon, CircleAlertIcon, EyeIcon, EyeOffIcon, Loader2Icon, MailCheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth/client";
import { updateMyContact } from "@/lib/actions";
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

// Better Auth error codes → messages people can act on.
function friendly(error: { code?: string; message?: string; status?: number } | null | undefined) {
  switch (error?.code) {
    case "INVALID_EMAIL_OR_PASSWORD":
      return "That email and password don't match. Check them and try again.";
    case "USER_ALREADY_EXISTS":
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return "An account with this email already exists. Sign in instead.";
    case "PASSWORD_TOO_SHORT":
      return "Use at least 8 characters for your password.";
    case "INVALID_OTP":
      return "That code isn't right. Check the email and try again.";
    case "OTP_EXPIRED":
      return "That code has expired. Send a new one.";
    case "TOO_MANY_ATTEMPTS":
      return "Too many attempts. Wait a minute and try again.";
    default:
      return error?.message || "Something went wrong. Please try again.";
  }
}

/** Only relative paths, so a link can't send people to another site after sign-in. */
const safePath = (p?: string) => (p && p.startsWith("/") && !p.startsWith("//") ? p : undefined);

export const DEMO_ACCOUNTS = [
  { label: "Customer", email: "kemi@example.com" },
  { label: "Advisor", email: "tunde@example.com" },
  { label: "Admin", email: "folake@example.com" },
];

export function AuthForm({
  view,
  fromCalculator,
  redirectTo,
  deactivated,
  showDemo,
}: {
  view: AuthView;
  fromCalculator?: boolean;
  redirectTo?: string;
  deactivated?: boolean;
  showDemo?: boolean;
}) {
  const [loading, setLoading] = useState<"form" | "google" | null>(null);
  const [showPw, setShowPw] = useState(false);
  const [codeSentTo, setCodeSentTo] = useState<string | null>(null);
  const [resetDone, setResetDone] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [consent, setConsent] = useState(false);
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  // Until React has hydrated, submitting would fall back to a native form submit. Keep buttons disabled.
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const after = safePath(redirectTo) ?? "/home";

  const strength = Math.min(4, [pw.length >= 8, /[A-Z]/.test(pw), /\d/.test(pw), /[^A-Za-z0-9]/.test(pw)].filter(Boolean).length);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const name = String(f.get("name") ?? "").trim();
    const phone = String(f.get("phone") ?? "").trim();
    const otp = String(f.get("otp") ?? "").trim();
    const next: Record<string, string> = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) next.email = "Enter a valid email address.";
    if ((view !== "forgot-password" || codeSentTo) && pw.length < 8) next.password = "Use at least 8 characters.";
    if (view === "sign-up" && name.length < 2) next.name = "Enter your full name.";
    if (view === "sign-up" && !consent) next.consent = "Please accept the privacy policy to continue.";
    if (view === "forgot-password" && codeSentTo && !/^\d{6}$/.test(otp)) next.otp = "Enter the 6-digit code from the email.";
    if (view === "forgot-password" && !codeSentTo) delete next.password;
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading("form");
    try {
      if (view === "sign-in") {
        const { error } = await authClient.signIn.email({ email, password: pw });
        if (error) throw error;
        window.location.assign(after); // full page load: fresh session everywhere
        return;
      }
      if (view === "sign-up") {
        const { error } = await authClient.signUp.email({ email, password: pw, name });
        if (error) throw error;
        if (phone) await updateMyContact({ phone: `+234 ${phone}` });
        window.location.assign("/dashboard");
        return;
      }
      // forgot password: send a code, then reset with it
      if (!codeSentTo) {
        const { error } = await authClient.emailOtp.sendVerificationOtp({ email, type: "forget-password" });
        if (error) throw error;
        setCodeSentTo(email);
      } else {
        const { error } = await authClient.emailOtp.resetPassword({ email, otp, password: pw });
        if (error) throw error;
        setResetDone(true);
      }
      setLoading(null);
    } catch (err) {
      setErrors({ form: friendly(err as { code?: string; message?: string }) });
      setLoading(null);
    }
  };

  const google = async () => {
    setLoading("google");
    const { error } = await authClient.signIn.social({ provider: "google", callbackURL: `${window.location.origin}${after}` });
    if (error) {
      setErrors({ form: friendly(error) });
      setLoading(null);
    }
  };

  if (view === "forgot-password" && resetDone) {
    return (
      <div className="text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-500/15 text-emerald-500">
          <MailCheckIcon className="size-6" />
        </span>
        <h1 className="mt-5 font-display text-2xl font-extrabold">Password updated</h1>
        <p className="mt-2 text-sm text-muted-foreground">You can now sign in with your new password.</p>
        <Button asChild className={cn(goldButton, "mt-6")}>
          <Link href="/auth/sign-in">Sign in</Link>
        </Button>
      </div>
    );
  }

  const title = { "sign-in": "Welcome back", "sign-up": "Talk to a solar expert", "forgot-password": codeSentTo ? "Check your inbox" : "Forgot your password?" }[view];
  const subtitle = {
    "sign-in": "Sign in to see your project, quote and messages.",
    "sign-up": "Create a free account. We'll match you with a dedicated advisor.",
    "forgot-password": codeSentTo ? `We sent a 6-digit code to ${codeSentTo}. Enter it with your new password.` : "Enter your email and we'll send you a reset code.",
  }[view];

  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold tracking-tight">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>

      {deactivated && (
        <p className="mt-5 flex gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <CircleAlertIcon className="mt-0.5 size-4 shrink-0" /> This account has been deactivated. Contact us if you think this is a mistake.
        </p>
      )}

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
          <Button variant="outline" className="mt-6 h-11 w-full" onClick={google} disabled={!ready || loading !== null}>
            {loading === "google" ? <Loader2Icon className="animate-spin" /> : <GoogleIcon />} Continue with Google
          </Button>
          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or with email <span className="h-px flex-1 bg-border" />
          </div>
        </>
      )}

      {/* method="post": if JavaScript isn't running, credentials must never end up in a URL */}
      <form method="post" onSubmit={submit} noValidate className={cn("space-y-4", view === "forgot-password" && "mt-6")}>
        {errors.form && (
          <p role="alert" className="flex gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            <CircleAlertIcon className="mt-0.5 size-4 shrink-0" /> {errors.form}
          </p>
        )}
        {view === "sign-up" && (
          <FieldWrap id="name" label="Full name" error={errors.name}>
            <Input id="name" name="name" autoComplete="name" placeholder="Kemi Adeyemi" aria-invalid={!!errors.name} className="h-10" />
          </FieldWrap>
        )}
        <FieldWrap id="email" label="Email" error={errors.email}>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={!!errors.email}
            className="h-10"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            readOnly={!!codeSentTo}
          />
        </FieldWrap>
        {view === "sign-up" && (
          <FieldWrap id="phone" label="Phone (optional)">
            <div className="flex">
              <span className="grid place-items-center rounded-l-lg border border-r-0 bg-muted px-3 text-sm text-muted-foreground">+234</span>
              <Input id="phone" name="phone" type="tel" autoComplete="tel-national" placeholder="801 234 5678" className="h-10 rounded-l-none" />
            </div>
          </FieldWrap>
        )}
        {view === "forgot-password" && codeSentTo && (
          <FieldWrap id="otp" label="6-digit code" error={errors.otp}>
            <Input id="otp" name="otp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="123456" className="h-10 tracking-[0.4em]" aria-invalid={!!errors.otp} />
          </FieldWrap>
        )}
        {(view !== "forgot-password" || codeSentTo) && (
          <FieldWrap
            id="password"
            label={view === "forgot-password" ? "New password" : "Password"}
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
                autoComplete={view === "sign-in" ? "current-password" : "new-password"}
                aria-invalid={!!errors.password}
                className="h-10 pr-10"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
              />
              <Button type="button" variant="ghost" size="icon-sm" className="absolute top-1/2 right-1.5 -translate-y-1/2" onClick={() => setShowPw(!showPw)} aria-label={showPw ? "Hide password" : "Show password"}>
                {showPw ? <EyeOffIcon /> : <EyeIcon />}
              </Button>
            </div>
            {view !== "sign-in" && pw && (
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
        <Button type="submit" className={cn(goldButton, "h-11 w-full text-base")} disabled={!ready || loading !== null}>
          {loading === "form" && <Loader2Icon className="animate-spin" />}
          {view === "sign-in" ? "Sign in" : view === "sign-up" ? "Create account" : codeSentTo ? "Reset password" : "Send reset code"}
        </Button>
        {view === "forgot-password" && codeSentTo && (
          <button type="button" className="w-full text-center text-xs text-muted-foreground hover:text-foreground" onClick={() => setCodeSentTo(null)}>
            Use a different email or send a new code
          </button>
        )}
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

      {view === "sign-in" && showDemo && (
        <div className="mt-8 rounded-xl border border-dashed p-4">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Demo accounts (local only)</p>
          <p className="mt-1 text-xs text-muted-foreground">Fills the form. The password is in the seed script output.</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {DEMO_ACCOUNTS.map((d) => (
              <Button key={d.email} type="button" variant="secondary" size="sm" className="h-9" onClick={() => setEmail(d.email)}>
                {d.label}
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
