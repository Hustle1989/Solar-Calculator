import type { Metadata } from "next";
import Link from "next/link";
import { CircleAlertIcon, HeadsetIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { InviteAccept } from "@/components/auth/invite-accept";
import { admin, reps } from "@/lib/mock-data";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Accept invite", robots: { index: false } };

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invite = reps.find((r) => r.status === "invited")!;
  const expired = token === "expired";
  const expires = new Date(invite.joined.getTime() + 7 * 86_400_000);

  return (
    <div className="dark min-h-dvh bg-night text-foreground">
      <div className="p-4 sm:p-6">
        <Logo />
      </div>
      <div className="mx-auto max-w-md px-4 pt-6 pb-16">
        <div className="gold-border rounded-2xl p-6 sm:p-8">
          {expired ? (
            <div className="text-center">
              <span className="mx-auto grid size-14 place-items-center rounded-full bg-destructive/15 text-destructive">
                <CircleAlertIcon className="size-6" />
              </span>
              <h1 className="mt-5 font-display text-2xl font-extrabold">This invite has expired</h1>
              <p className="mt-2 text-sm text-muted-foreground">Invite links last 7 days. Ask {admin.name} to send you a new one.</p>
              <Button asChild variant="outline" className="mt-6">
                <Link href="/">Go to homepage</Link>
              </Button>
            </div>
          ) : (
            <>
              <span className="grid size-14 place-items-center rounded-full border-2 border-gold/70 text-gold-text">
                <HeadsetIcon className="size-6" />
              </span>
              <p className="mt-5 text-xs tracking-[0.25em] text-gold-text uppercase">You&apos;re invited</p>
              <h1 className="mt-1 font-display text-2xl font-extrabold">Join the team as a solar advisor</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {admin.name} invited <span className="text-foreground">{invite.email}</span>. This link expires {formatDate(expires)}.
              </p>
              <InviteAccept email={invite.email} name={invite.name} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
