import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AuthForm, type AuthView } from "@/components/auth/auth-form";

const VIEWS: Record<AuthView, string> = {
  "sign-in": "Sign in",
  "sign-up": "Create your account",
  "forgot-password": "Reset your password",
};

export function generateStaticParams() {
  return Object.keys(VIEWS).map((path) => ({ path }));
}

export async function generateMetadata({ params }: { params: Promise<{ path: string }> }): Promise<Metadata> {
  const { path } = await params;
  return { title: VIEWS[path as AuthView] ?? "Account" };
}

export default async function AuthPage({ params, searchParams }: { params: Promise<{ path: string }>; searchParams: Promise<{ from?: string }> }) {
  const { path } = await params;
  const { from } = await searchParams;
  if (!(path in VIEWS)) notFound();
  return <AuthForm view={path as AuthView} fromCalculator={from === "calculator"} />;
}
