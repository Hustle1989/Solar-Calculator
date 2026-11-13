import type { Metadata } from "next";
import { conversations, DEMO_CUSTOMER_ID, getRep } from "@/lib/mock-data";
import { ChatConversation } from "@/components/chat/chat-conversation";
import { PreviewNotice } from "@/components/shared/preview-notice";

export const metadata: Metadata = { title: "Messages" };

export default function CustomerChatPage() {
  const rep = getRep("r-1")!;
  return (
    <div className="-m-4 flex h-[calc(100dvh-4rem)] flex-col sm:-m-6 lg:-m-8">
      <div className="border-b bg-background px-4 py-2">
        <PreviewNotice>Demo conversation. Real chat with your advisor (Stream) connects in Phase 2.</PreviewNotice>
      </div>
      <div className="min-h-0 flex-1 bg-card">
        <ChatConversation meId={DEMO_CUSTOMER_ID} peer={{ id: rep.id, name: rep.name, online: rep.online, subtitle: rep.title }} initialMessages={conversations[DEMO_CUSTOMER_ID]} />
      </div>
    </div>
  );
}
