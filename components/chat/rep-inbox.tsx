"use client";

import { useMemo, useState } from "react";
import { SearchIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTime, timeAgo } from "@/lib/format";
import { conversations, customers, type Message } from "@/lib/mock-data";
import { Input } from "@/components/ui/input";
import { StageBadge } from "@/components/shared/stage";
import { UserAvatar } from "@/components/shared/ui-bits";
import { ChatConversation } from "./chat-conversation";

const UNREAD: Record<string, number> = { "c-1001": 1, "c-1005": 1 };

export function RepInbox({ repId }: { repId: string }) {
  const mine = customers.filter((c) => c.repId === repId);
  const [activeId, setActiveId] = useState<string | null>(mine[0]?.id ?? null);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [q, setQ] = useState("");

  const list = useMemo(
    () =>
      mine
        .filter((c) => c.name.toLowerCase().includes(q.toLowerCase()))
        .map((c) => {
          const msgs: Message[] = conversations[c.id] ?? [];
          return { c, last: msgs.at(-1) };
        })
        .sort((a, b) => (b.last?.at.getTime() ?? 0) - (a.last?.at.getTime() ?? 0)),
    [mine, q],
  );
  const active = customers.find((c) => c.id === activeId);

  return (
    <div className="flex h-full min-h-0 overflow-hidden rounded-2xl border bg-card">
      <aside className={cn("flex w-full shrink-0 flex-col border-r md:w-80", mobileShowChat && "hidden md:flex")} aria-label="Conversations">
        <div className="border-b p-3">
          <div className="relative">
            <SearchIcon className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search customers" className="pl-8" aria-label="Search customers" />
          </div>
        </div>
        <ul className="min-h-0 flex-1 overflow-y-auto">
          {list.map(({ c, last }) => (
            <li key={c.id}>
              <button
                onClick={() => {
                  setActiveId(c.id);
                  setMobileShowChat(true);
                }}
                className={cn(
                  "flex w-full items-start gap-3 border-b px-3 py-3 text-left transition hover:bg-muted/60",
                  activeId === c.id && "bg-gold-soft hover:bg-gold-soft",
                )}
              >
                <UserAvatar name={c.name} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold">{c.name}</span>
                    <span className="ml-auto shrink-0 text-[0.7rem] text-muted-foreground">{last ? timeAgo(last.at) : ""}</span>
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {last ? (last.system ? last.system.title : last.text || "📎 Attachment") : "No messages yet"}
                  </span>
                  <span className="mt-1.5 flex items-center gap-2">
                    <StageBadge stage={c.stage} className="h-4.5 text-[0.65rem]" />
                    {UNREAD[c.id] ? (
                      <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-gold-gradient px-1.5 text-[0.65rem] font-bold text-black">
                        {UNREAD[c.id]}
                      </span>
                    ) : null}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </aside>
      <div className={cn("min-w-0 flex-1", !mobileShowChat && "hidden md:block")}>
        {active ? (
          <ChatConversation
            key={active.id}
            meId={repId}
            peer={{ id: active.id, name: active.name, online: active.id === "c-1001", subtitle: `${active.city} · last active ${formatTime(active.lastActivity)}` }}
            initialMessages={conversations[active.id] ?? []}
            onBack={() => setMobileShowChat(false)}
          />
        ) : (
          <div className="grid h-full place-items-center text-sm text-muted-foreground">Select a conversation</div>
        )}
      </div>
    </div>
  );
}
