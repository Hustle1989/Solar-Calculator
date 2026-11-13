import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/ui-bits";
import { PricingManager } from "@/components/admin/pricing-manager";
import { requireViewer } from "@/lib/auth/viewer";
import { getCatalog } from "@/lib/data";

export const metadata: Metadata = { title: "Pricing" };

export default async function AdminPricingPage() {
  await requireViewer(["admin"], "/admin/pricing");
  const { equipment, appliances, settings } = await getCatalog();
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        eyebrow="Pricing"
        title="Prices & calculator settings"
        description="Everything the public calculator uses. Changes apply instantly to new estimates. Saved calculations keep the prices they were made with."
      />
      <PricingManager equipment={equipment} appliances={appliances} settings={settings} />
    </div>
  );
}
