import type { Metadata } from "next";
import { conversations, DEMO_CUSTOMER_ID, getCustomer, getRep } from "@/lib/mock-data";
import { ChatConversation } from "@/components/chat/chat-conversation";

export const metadata: Metadata = { title: "Messages" };

export default function CustomerChatPage() {
  const me = getCustomer(DEMO_CUSTOMER_ID)!;
  const rep = getRep(me.repId)!;
  return (
    <div className="-m-4 h-[calc(100dvh-4rem)] sm:-m-6 lg:-m-8">
      <div className="h-full bg-card">
        <ChatConversation
          meId={me.id}
          peer={{ id: rep.id, name: rep.name, online: rep.online, subtitle: rep.title }}
          initialMessages={conversations[me.id]}
        />
      </div>
    </div>
  );
}
