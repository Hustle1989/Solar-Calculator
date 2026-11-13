import type { Metadata } from "next";
import { PageHeader, SectionTitle } from "@/components/shared/ui-bits";
import { MediaManager } from "@/components/media/media-manager";
import { DEMO_CUSTOMER_ID, media } from "@/lib/mock-data";
import { PreviewNotice } from "@/components/shared/preview-notice";

export const metadata: Metadata = { title: "Site media" };

export default function MediaPage() {
  const site = media.filter((m) => m.kind === "site");
  const progress = media.filter((m) => m.kind === "progress");
  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <PageHeader
        eyebrow="Site media"
        title="Photos & videos"
        description="Clear photos of your roof, meter and distribution board help your advisor plan your system without an extra site visit."
      />
      <PreviewNotice>Demo data. Uploads are stored securely with ImageKit in Phase 4.</PreviewNotice>
      <section>
        <SectionTitle>Your uploads</SectionTitle>
        <MediaManager
          initial={site}
          uploaderId={DEMO_CUSTOMER_ID}
          kind="site"
          title="Drop photos or videos here"
          description="Roof (from several angles), electricity meter, distribution board and where you'd like the inverter and batteries."
        />
      </section>
      <section>
        <SectionTitle>From your installation team</SectionTitle>
        <MediaManager initial={progress} uploaderId={DEMO_CUSTOMER_ID} kind="progress" title="" description="" canUpload={false} />
      </section>
    </div>
  );
}
