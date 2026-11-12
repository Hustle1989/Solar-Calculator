import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/ui-bits";
import { PricingManager } from "@/components/admin/pricing-manager";
import { appliances, equipment, settings } from "@/lib/mock-data";

export const metadata: Metadata = { title: "Pricing" };

export default function AdminPricingPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Pricing"
        title="Prices & calculator settings"
        description="Everything the public calculator uses. Changes apply instantly to new estimates. Sent quotes keep their prices."
      />
      <PricingManager equipment={equipment} appliances={appliances} settings={settings} />
    </div>
  );
}
