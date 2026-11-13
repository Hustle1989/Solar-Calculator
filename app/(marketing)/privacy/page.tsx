import type { Metadata } from "next";
import { brand } from "@/lib/brand";
import { eyebrow } from "@/components/shared/styles";

export const metadata: Metadata = { title: "Privacy policy" };

const sections = [
  { h: "What we collect", p: "Your name, email, phone number and address; the appliances and usage you enter in the calculator; photos and videos of your site that you choose to upload; messages and calls with your advisor; and payment status (we never see or store your card details)." },
  { h: "Why we collect it", p: "To size and price your solar system, assign you an advisor, prepare quotes, schedule site surveys and installations, and keep you updated. We do not sell your data." },
  { h: "Who can see it", p: "Only you, your assigned advisor and our operations team. Site photos are stored privately and shown through short-lived secure links." },
  { h: "Service providers", p: "We use trusted processors for hosting, database, messaging and video calls, payments, media storage, email and error monitoring. Each processes data only on our instructions." },
  { h: "Your rights", p: "Under the Nigeria Data Protection Act 2023 you can access, correct or ask us to delete your personal data, and withdraw consent at any time. Contact us and we'll respond within 30 days." },
  { h: "Retention", p: "We keep account and project records for as long as your system is under warranty, and payment records as required by law. Deactivated accounts are anonymised where possible." },
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
      <p className={eyebrow}>Legal</p>
      <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight uppercase">Privacy policy</h1>
      <p className="mt-3 text-sm text-muted-foreground">Last updated 12 November 2026 · Draft for review</p>
      <div className="gold-rule mt-6 w-16" />
      <div className="mt-10 space-y-8">
        {sections.map((s) => (
          <section key={s.h}>
            <h2 className="font-display text-lg font-bold">{s.h}</h2>
            <p className="mt-2 leading-relaxed text-muted-foreground">{s.p}</p>
          </section>
        ))}
        <section>
          <h2 className="font-display text-lg font-bold">Contact</h2>
          <p className="mt-2 text-muted-foreground">
            {brand.name} · {brand.address} · {brand.email}
          </p>
        </section>
      </div>
    </div>
  );
}
