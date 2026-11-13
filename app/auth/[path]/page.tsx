import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AuthForm, type AuthView } from "@/components/auth/auth-form";
import { getViewer, ROLE_HOME } from "@/lib/auth/viewer";

export const dynamic = "force-dynamic";

const VIEWS: Record<AuthView, string> = {
  "sign-in": "Sign in",
  "sign-up": "Create your account",
  "forgot-password": "Reset your password",
};

export async function generateMetadata({ params }: { params: Promise<{ path: string }> }): Promise<Metadata> {
  const { path } = await params;
  return { title: VIEWS[path as AuthView] ?? "Account" };
}

export default async function AuthPage({
  params,
  searchParams,
}: {
  params: Promise<{ path: string }>;
  searchParams: Promise<{ from?: string; redirectTo?: string; deactivated?: string }>;
}) {
  const { path } = await params;
  const { from, redirectTo, deactivated } = await searchParams;
  if (!(path in VIEWS)) notFound();

  // Already signed in (and active)? Go straight to the right home.
  const viewer = await getViewer();
  if (viewer?.profile.active && path !== "forgot-password") redirect(ROLE_HOME[viewer.profile.role]);

  return (
    <AuthForm
      view={path as AuthView}
      fromCalculator={from === "calculator"}
      redirectTo={redirectTo}
      deactivated={deactivated === "1"}
      showDemo={process.env.NEXT_PUBLIC_DEMO_ACCOUNTS === "1"}
    />
  );
}
