import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/logo";
import { goldButton } from "@/components/shared/styles";

export default function NotFound() {
  return (
    <div className="dark grid min-h-dvh place-items-center bg-night px-4 text-center text-foreground">
      <div>
        <Logo className="justify-center" />
        <p className="mt-10 font-display text-8xl font-black text-gold-gradient">404</p>
        <h1 className="mt-2 font-display text-2xl font-extrabold uppercase">Power cut on this page</h1>
        <p className="mt-2 text-muted-foreground">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
        <Button asChild className={`${goldButton} mt-8 h-11 px-6`}>
          <Link href="/">Back to the homepage</Link>
        </Button>
      </div>
    </div>
  );
}
