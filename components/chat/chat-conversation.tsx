"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeftIcon,
  MessageCircleIcon,
  PaperclipIcon,
  ReceiptIcon,
  ReplyIcon,
  SendIcon,
  SmilePlusIcon,
  XIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate, formatTime } from "@/lib/format";
import { lagosYmd } from "@/lib/booking/slots";
import { people, type Attachment, type Message } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MediaThumb, UserAvatar } from "@/components/shared/ui-bits";
import { StartCallButton } from "@/components/call/start-call-button";

const EMOJIS = ["👍", "❤️", "😂", "🔥", "🙏", "🎉"];
const CANNED = [
  "Thanks! Let me check and get back to you shortly.",
  "Great question. I'll add that to your quote notes.",
  "Noted 👍",
];

export type Peer = { id: string; name: string; online: boolean; subtitle: string };

export function ChatConversation({
  meId,
  peer,
  initialMessages,
  onBack,
  className,
}: {
  meId: string;
  peer: Peer;
  initialMessages: Message[];
  onBack?: () => void;
  className?: string;
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [typing, setTyping] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const cannedIdx = useRef(0);

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [messages.length, typing]);

  const thread = messages.find((m) => m.id === threadId) ?? null;

  const toggleReaction = (msgId: string, emoji: string, parentId?: string) => {
    const apply = (m: Message): Message => {
      if (m.id !== msgId) return m;
      const reactions = [...(m.reactions ?? [])];
      const i = reactions.findIndex((r) => r.emoji === emoji);
      if (i === -1) reactions.push({ emoji, by: [meId] });
      else {
        const by = reactions[i].by.includes(meId) ? reactions[i].by.filter((x) => x !== meId) : [...reactions[i].by, meId];
        if (by.length) reactions[i] = { ...reactions[i], by };
        else reactions.splice(i, 1);
      }
      return { ...m, reactions };
    };
    setMessages((ms) => ms.map((m) => (parentId && m.id === parentId ? { ...m, replies: m.replies?.map(apply) } : apply(m))));
  };

  const send = (text: string, attachments: Attachment[], parentId?: string) => {
    const msg: Message = { id: `local-${Date.now()}`, authorId: meId, text, at: new Date(), attachments: attachments.length ? attachments : undefined };
    if (parentId) {
      setMessages((ms) => ms.map((m) => (m.id === parentId ? { ...m, replies: [...(m.replies ?? []), msg] } : m)));
      return;
    }
    setMessages((ms) => [...ms, msg]);
    // Simulate the other side replying, to preview typing + live updates.
    setTimeout(() => setTyping(true), 700);
    setTimeout(() => {
      setTyping(false);
      setMessages((ms) => [...ms, { id: `peer-${Date.now()}`, authorId: peer.id, text: CANNED[cannedIdx.current++ % CANNED.length], at: new Date() }]);
    }, 2600);
  };

  return (
    <div className={cn("flex h-full min-h-0 overflow-hidden", className)}>
      <section className={cn("flex min-w-0 flex-1 flex-col", thread && "hidden xl:flex")} aria-label={`Conversation with ${peer.name}`}>
        {/* header */}
        <div className="flex items-center gap-3 border-b px-4 py-3">
          {onBack && (
            <Button variant="ghost" size="icon-sm" className="md:hidden" onClick={onBack} aria-label="Back to conversations">
              <ArrowLeftIcon />
            </Button>
          )}
          <UserAvatar name={peer.name} online={peer.online} gold />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{peer.name}</p>
            <p className="truncate text-xs text-muted-foreground">{typing ? <span className="text-gold-text">typing…</span> : peer.online ? `Online · ${peer.subtitle}` : peer.subtitle}</p>
          </div>
          <StartCallButton peer={peer.name} size="sm" className="hidden sm:inline-flex" />
          <StartCallButton peer={peer.name} size="icon-sm" label="" className="sm:hidden" />
        </div>

        {/* messages */}
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-5">
          <MessageList messages={messages} meId={meId} onReact={toggleReaction} onOpenThread={setThreadId} />
          {typing && (
            <div className="mt-3 flex items-center gap-2 pl-11 text-xs text-muted-foreground">
              <span className="flex gap-1 rounded-full bg-muted px-3 py-2">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="size-1.5 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: `${i * 120}ms` }} />
                ))}
              </span>
            </div>
          )}
          <div ref={bottom} />
        </div>

        <Composer placeholder={`Message ${peer.name.split(" ")[0]}…`} onSend={(t, a) => send(t, a)} />
      </section>

      {thread && (
        <aside className="flex w-full flex-col border-l xl:w-[380px]" aria-label="Thread">
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <MessageCircleIcon className="size-4 text-gold-text" />
            <p className="flex-1 font-semibold">Thread</p>
            <Button variant="ghost" size="icon-sm" onClick={() => setThreadId(null)} aria-label="Close thread">
              <XIcon />
            </Button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
            <MessageList messages={[thread]} meId={meId} onReact={toggleReaction} hideThreadLink />
            <div className="my-3 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              {thread.replies?.length ?? 0} {(thread.replies?.length ?? 0) === 1 ? "reply" : "replies"}
              <span className="h-px flex-1 bg-border" />
            </div>
            <MessageList messages={thread.replies ?? []} meId={meId} onReact={(id, e) => toggleReaction(id, e, thread.id)} hideThreadLink />
          </div>
          <Composer placeholder="Reply in thread…" onSend={(t, a) => send(t, a, thread.id)} />
        </aside>
      )}
    </div>
  );
}

function MessageList({
  messages,
  meId,
  onReact,
  onOpenThread,
  hideThreadLink,
}: {
  messages: Message[];
  meId: string;
  onReact: (id: string, emoji: string) => void;
  onOpenThread?: (id: string) => void;
  hideThreadLink?: boolean;
}) {
  const rows = useMemo(() => {
    const t = lagosYmd(new Date());
    const dayKey = (d: Date) => {
      const x = lagosYmd(d);
      return `${x.y}-${x.m}-${x.d}`;
    };
    const todayKey = `${t.y}-${t.m}-${t.d}`;
    const yesterday = lagosYmd(new Date(Date.now() - 86_400_000));
    const yKey = `${yesterday.y}-${yesterday.m}-${yesterday.d}`;
    return messages.map((m, i) => {
      const prev = messages[i - 1];
      const k = dayKey(m.at);
      const newDay = !prev || dayKey(prev.at) !== k;
      const grouped = !newDay && prev && prev.authorId === m.authorId && !prev.system && m.at.getTime() - prev.at.getTime() < 5 * 60_000;
      const label = k === todayKey ? "Today" : k === yKey ? "Yesterday" : formatDate(m.at, { weekday: "long", day: "numeric", month: "short" });
      return { m, newDay, grouped, label };
    });
  }, [messages]);

  return (
    <ol className="space-y-1">
      {rows.map(({ m, newDay, grouped, label }) => (
        <li key={m.id}>
          {newDay && (
            <div className="my-4 flex items-center gap-3 text-[0.7rem] font-medium tracking-wide text-muted-foreground uppercase">
              <span className="h-px flex-1 bg-border" /> {label} <span className="h-px flex-1 bg-border" />
            </div>
          )}
          {m.system ? (
            <SystemMessage m={m} />
          ) : (
            <MessageRow m={m} mine={m.authorId === meId} grouped={!!grouped} onReact={onReact} onOpenThread={onOpenThread} hideThreadLink={hideThreadLink} meId={meId} />
          )}
        </li>
      ))}
    </ol>
  );
}

function SystemMessage({ m }: { m: Message }) {
  return (
    <div className="my-3 flex justify-center">
      <div className="flex items-center gap-3 rounded-xl border border-gold/30 bg-gold-soft px-4 py-2.5 text-sm">
        <ReceiptIcon className="size-4 text-gold-text" />
        <span className="font-medium">{m.system!.title}</span>
        {m.system!.href && (
          <Link href={m.system!.href} className="font-semibold text-gold-text hover:underline">
            View
          </Link>
        )}
      </div>
    </div>
  );
}

function MessageRow({
  m,
  mine,
  grouped,
  meId,
  onReact,
  onOpenThread,
  hideThreadLink,
}: {
  m: Message;
  mine: boolean;
  grouped: boolean;
  meId: string;
  onReact: (id: string, emoji: string) => void;
  onOpenThread?: (id: string) => void;
  hideThreadLink?: boolean;
}) {
  const author = people[m.authorId]?.name ?? "Unknown";
  return (
    <div className={cn("group flex gap-2.5", mine && "flex-row-reverse", !grouped && "mt-3")}>
      <div className="w-8 shrink-0">{!grouped && !mine && <UserAvatar name={author} size="default" />}</div>
      <div className={cn("flex max-w-[min(80%,560px)] flex-col", mine && "items-end")}>
        {!grouped && (
          <p className={cn("mb-1 text-xs text-muted-foreground", mine && "text-right")}>
            {mine ? "You" : author} · {formatTime(m.at)}
          </p>
        )}
        <div className={cn("relative flex items-center gap-1", mine && "flex-row-reverse")}>
          <div
            className={cn(
              "rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
              mine ? "rounded-tr-md bg-gold-soft ring-1 ring-gold/25" : "rounded-tl-md bg-muted",
              !m.text && "p-1.5",
            )}
          >
            {m.text && <p className="whitespace-pre-wrap">{m.text}</p>}
            {m.attachments && (
              <div className={cn("grid gap-1.5", m.text && "mt-2", m.attachments.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
                {m.attachments.map((a) => (
                  <figure key={a.name} className="w-44 max-w-full sm:w-52">
                    <MediaThumb type={a.kind} tone={a.tone} />
                    <figcaption className="mt-1 truncate text-[0.7rem] text-muted-foreground">
                      {a.name} · {a.size}
                    </figcaption>
                  </figure>
                ))}
              </div>
            )}
          </div>
          {/* hover actions */}
          <div className="flex shrink-0 items-center opacity-0 transition group-focus-within:opacity-100 group-hover:opacity-100">
            <Popover>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon-xs" aria-label="Add reaction">
                      <SmilePlusIcon />
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>React</TooltipContent>
              </Tooltip>
              <PopoverContent className="w-auto p-1.5" side="top">
                <div className="flex gap-0.5">
                  {EMOJIS.map((e) => (
                    <button key={e} className="rounded-md p-1.5 text-lg transition hover:scale-110 hover:bg-muted" onClick={() => onReact(m.id, e)} aria-label={`React ${e}`}>
                      {e}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            {onOpenThread && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon-xs" aria-label="Reply in thread" onClick={() => onOpenThread(m.id)}>
                    <ReplyIcon />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reply in thread</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
        {(m.reactions?.length ?? 0) > 0 && (
          <div className={cn("mt-1 flex flex-wrap gap-1", mine && "justify-end")}>
            {m.reactions!.map((r) => {
              const me = r.by.includes(meId);
              return (
                <button
                  key={r.emoji}
                  onClick={() => onReact(m.id, r.emoji)}
                  aria-pressed={me}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition",
                    me ? "border-gold/50 bg-gold-soft text-gold-text" : "bg-background hover:bg-muted",
                  )}
                >
                  {r.emoji} <span className="tabular-nums">{r.by.length}</span>
                </button>
              );
            })}
          </div>
        )}
        {!hideThreadLink && (m.replies?.length ?? 0) > 0 && (
          <button onClick={() => onOpenThread?.(m.id)} className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-gold-text hover:underline">
            <MessageCircleIcon className="size-3.5" />
            {m.replies!.length} {m.replies!.length === 1 ? "reply" : "replies"}
          </button>
        )}
      </div>
    </div>
  );
}

function Composer({ placeholder, onSend }: { placeholder: string; onSend: (text: string, attachments: Attachment[]) => void }) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<Attachment[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);

  const submit = () => {
    if (!text.trim() && !files.length) return;
    onSend(text.trim(), files);
    setText("");
    setFiles([]);
  };

  return (
    <div className="border-t p-3">
      {files.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {files.map((f) => (
            <span key={f.name} className="inline-flex items-center gap-1.5 rounded-lg border bg-muted/60 px-2 py-1 text-xs">
              <PaperclipIcon className="size-3" /> {f.name}
              <button onClick={() => setFiles((fs) => fs.filter((x) => x !== f))} aria-label={`Remove ${f.name}`}>
                <XIcon className="size-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex items-end gap-2 rounded-xl border bg-background p-1.5 focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30">
        <input
          ref={fileInput}
          type="file"
          multiple
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => {
            const picked = Array.from(e.target.files ?? []).map<Attachment>((f) => ({
              kind: f.type.startsWith("video") ? "video" : "image",
              name: f.name,
              size: `${(f.size / 1024 / 1024).toFixed(1)} MB`,
              tone: "from-stone-700 to-zinc-900",
            }));
            setFiles((fs) => [...fs, ...picked]);
            e.target.value = "";
          }}
        />
        <Button variant="ghost" size="icon-sm" aria-label="Attach photo or video" onClick={() => fileInput.current?.click()}>
          <PaperclipIcon />
        </Button>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={placeholder}
          rows={1}
          className="max-h-36 min-h-8 flex-1 resize-none border-0 bg-transparent px-1 py-1.5 shadow-none focus-visible:ring-0 dark:bg-transparent"
          aria-label="Message"
        />
        <Button size="icon-sm" className="bg-gold-gradient text-black hover:brightness-110" onClick={submit} aria-label="Send" disabled={!text.trim() && !files.length}>
          <SendIcon />
        </Button>
      </div>
      <p className="mt-1.5 px-1 text-[0.65rem] text-muted-foreground">Enter to send · Shift + Enter for a new line</p>
    </div>
  );
}
