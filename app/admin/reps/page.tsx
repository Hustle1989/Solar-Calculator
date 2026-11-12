import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/ui-bits";
import { RepsManager } from "@/components/admin/reps-manager";
import { reps } from "@/lib/mock-data";

export const metadata: Metadata = { title: "Advisors" };

export default function AdminRepsPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader eyebrow="Team" title="Solar advisors" description="Invite advisors, see their workload and deactivate accounts when people leave." />
      <RepsManager initial={reps} />
    </div>
  );
}
