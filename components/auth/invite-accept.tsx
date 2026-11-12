"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon, LockIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { goldButton } from "@/components/shared/styles";
import { GoogleIcon } from "./auth-form";

export function InviteAccept({ email, name }: { email: string; name: string }) {
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  const go = () => {
    setLoading(true);
    setTimeout(() => router.push("/rep"), 900);
  };

  return (
    <form
      className="mt-6 space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (pw.length >= 8) go();
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="inv-name">Full name</Label>
        <Input id="inv-name" defaultValue={name} className="h-10" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="inv-email">Email</Label>
        <div className="relative">
          <Input id="inv-email" value={email} readOnly className="h-10 pr-9 text-muted-foreground" />
          <LockIcon className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
        </div>
        <p className="text-xs text-muted-foreground">Invites only work for the address they were sent to.</p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="inv-pw">Create a password</Label>
        <Input id="inv-pw" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} className="h-10" />
        {pw && pw.length < 8 && <p className="text-xs text-destructive">Use at least 8 characters.</p>}
      </div>
      <Button type="submit" className={cn(goldButton, "h-11 w-full")} disabled={loading || pw.length < 8}>
        {loading && <Loader2Icon className="animate-spin" />} Accept invite &amp; continue
      </Button>
      <Button type="button" variant="outline" className="h-11 w-full" onClick={go}>
        <GoogleIcon /> Continue with Google
      </Button>
    </form>
  );
}
