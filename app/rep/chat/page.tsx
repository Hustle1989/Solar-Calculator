import type { Metadata } from "next";
import { DEMO_REP_ID } from "@/lib/mock-data";
import { RepInbox } from "@/components/chat/rep-inbox";
import { PreviewNotice } from "@/components/shared/preview-notice";

export const metadata: Metadata = { title: "Messages" };

export default function RepChatPage() {
  return (
    <div className="flex h-[calc(100dvh-4rem-2rem)] flex-col gap-3 sm:h-[calc(100dvh-4rem-3rem)] lg:h-[calc(100dvh-4rem-4rem)]">
      <PreviewNotice>Demo conversations. Real chat (Stream) connects in Phase 2.</PreviewNotice>
      <div className="min-h-0 flex-1">
        <RepInbox repId={DEMO_REP_ID} />
      </div>
    </div>
  );
}
