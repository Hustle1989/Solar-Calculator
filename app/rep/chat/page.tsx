import type { Metadata } from "next";
import { DEMO_REP_ID } from "@/lib/mock-data";
import { RepInbox } from "@/components/chat/rep-inbox";

export const metadata: Metadata = { title: "Messages" };

export default function RepChatPage() {
  return (
    <div className="h-[calc(100dvh-4rem-2rem)] sm:h-[calc(100dvh-4rem-3rem)] lg:h-[calc(100dvh-4rem-4rem)]">
      <RepInbox repId={DEMO_REP_ID} />
    </div>
  );
}
