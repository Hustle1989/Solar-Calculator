import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/ui-bits";
import { PreviewNotice } from "@/components/shared/preview-notice";
import { RepsManager } from "@/components/admin/reps-manager";
import { requireViewer } from "@/lib/auth/viewer";
import { listReps } from "@/lib/data";

export const metadata: Metadata = { title: "Advisors" };

export default async function AdminRepsPage() {
  await requireViewer(["admin"], "/admin/reps");
  const reps = await listReps();
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader eyebrow="Team" title="Solar advisors" description="See each advisor's workload and deactivate accounts when people leave." />
      <PreviewNotice>
        Email invites arrive in Phase 2 (Resend). Until then, the new advisor signs up normally and you make them an advisor with{" "}
        <code className="rounded bg-muted px-1">npm run db:set-role -- their@email.com rep</code>.
      </PreviewNotice>
      <RepsManager initial={reps} />
    </div>
  );
}
