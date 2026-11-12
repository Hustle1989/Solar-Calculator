"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import {
  LayoutGridIcon,
  MicIcon,
  MicOffIcon,
  PhoneIcon,
  PhoneOffIcon,
  ScreenShareIcon,
  UserRoundIcon,
  VideoIcon,
  VideoOffIcon,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/format";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type Phase = "idle" | "outgoing" | "incoming" | "connected";
type CallCtx = { startCall: (peer: string) => void; simulateIncoming: (peer: string) => void };

const Ctx = createContext<CallCtx | null>(null);

export const useCall = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCall must be used inside <CallProvider>");
  return c;
};

/** UI-only stand-in for Stream Video: ringing, in-call and incoming-call screens. */
export function CallProvider({ selfName, children }: { selfName: string; children: React.ReactNode }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [peer, setPeer] = useState("");

  const startCall = useCallback((p: string) => {
    setPeer(p);
    setPhase("outgoing");
  }, []);
  const simulateIncoming = useCallback((p: string) => {
    setPeer(p);
    setPhase("incoming");
  }, []);
  const connect = useCallback(() => setPhase("connected"), []);

  return (
    <Ctx.Provider value={{ startCall, simulateIncoming }}>
      {children}
      <IncomingCallCard
        open={phase === "incoming"}
        peer={peer}
        onAccept={connect}
        onDecline={() => {
          setPhase("idle");
          toast("Call declined");
        }}
      />
      <CallScreen
        phase={phase}
        peer={peer}
        selfName={selfName}
        onConnected={connect}
        onEnd={(duration) => {
          setPhase("idle");
          toast(duration ? `Call ended · ${duration}` : "Call cancelled");
        }}
      />
    </Ctx.Provider>
  );
}

function IncomingCallCard({ open, peer, onAccept, onDecline }: { open: boolean; peer: string; onAccept: () => void; onDecline: () => void }) {
  if (!open) return null;
  return (
    <div className="dark fixed right-4 bottom-4 z-[60] w-[min(22rem,calc(100vw-2rem))] animate-in fade-in slide-in-from-bottom-4" role="alertdialog" aria-label={`Incoming video call from ${peer}`}>
      <div className="gold-border rounded-2xl p-4 text-foreground shadow-2xl">
        <div className="flex items-center gap-3">
          <span className="grid size-12 shrink-0 animate-ring-pulse place-items-center rounded-full bg-gold-gradient font-display font-bold text-black">
            {initials(peer)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs tracking-wide text-gold-text uppercase">Incoming video call</p>
            <p className="truncate font-semibold">{peer}</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button variant="destructive" className="h-10" onClick={onDecline}>
            <PhoneOffIcon /> Decline
          </Button>
          <Button className="h-10 bg-emerald-600 text-white hover:bg-emerald-500" onClick={onAccept}>
            <VideoIcon /> Accept
          </Button>
        </div>
      </div>
    </div>
  );
}

function CallScreen({
  phase,
  peer,
  selfName,
  onConnected,
  onEnd,
}: {
  phase: Phase;
  peer: string;
  selfName: string;
  onConnected: () => void;
  onEnd: (duration?: string) => void;
}) {
  const open = phase === "outgoing" || phase === "connected";
  const [mic, setMic] = useState(true);
  const [cam, setCam] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [grid, setGrid] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval>>(undefined);

  // Simulate the peer answering.
  useEffect(() => {
    if (phase !== "outgoing") return;
    const t = setTimeout(onConnected, 2600);
    return () => clearTimeout(t);
  }, [phase, onConnected]);

  useEffect(() => {
    if (phase !== "connected") return;
    setSeconds(0);
    timer.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer.current);
  }, [phase]);

  const clock = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  const end = () => onEnd(phase === "connected" ? clock : undefined);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && end()}>
      <DialogContent
        showCloseButton={false}
        className="dark h-dvh w-screen max-w-none rounded-none bg-black p-0 text-foreground ring-0 sm:h-[min(88vh,760px)] sm:w-[min(92vw,1100px)] sm:max-w-none sm:rounded-2xl sm:ring-1"
      >
        <DialogTitle className="sr-only">Video call with {peer}</DialogTitle>
        <DialogDescription className="sr-only">{phase === "connected" ? "Connected" : "Calling"}</DialogDescription>
        <div className="relative flex h-full flex-col overflow-hidden bg-[radial-gradient(ellipse_at_top,oklch(0.25_0.04_250),black_70%)] sm:rounded-2xl">
          {/* top bar */}
          <div className="relative z-10 flex items-center justify-between p-4">
            <div>
              <p className="font-semibold">{peer}</p>
              <p className="text-xs text-muted-foreground">
                {phase === "connected" ? (
                  <span className="flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-emerald-400" /> {clock} · HD
                  </span>
                ) : (
                  "Ringing…"
                )}
              </p>
            </div>
            {phase === "connected" && sharing && (
              <span className="rounded-full bg-gold-soft px-3 py-1 text-xs text-gold-text">You are sharing your screen</span>
            )}
          </div>

          {/* stage */}
          <div className="relative flex-1 px-4">
            {phase === "outgoing" ? (
              <div className="grid h-full place-items-center">
                <div className="text-center">
                  <span className="mx-auto grid size-28 animate-ring-pulse place-items-center rounded-full bg-gold-gradient font-display text-3xl font-bold text-black">
                    {initials(peer)}
                  </span>
                  <p className="mt-6 font-display text-xl font-bold">Calling {peer.split(" ")[0]}…</p>
                  <p className="mt-1 text-sm text-muted-foreground">They&apos;ll get a ring on any device they&apos;re signed in on.</p>
                </div>
              </div>
            ) : (
              <div className={cn("grid h-full gap-3 pb-2", grid ? "sm:grid-cols-2" : "grid-cols-1")}>
                <Tile name={peer} big={!grid} tone="from-indigo-950 via-slate-900 to-black" speaking />
                {grid && <Tile name={`${selfName} (you)`} tone="from-stone-800 via-zinc-900 to-black" camOff={!cam} muted={!mic} />}
              </div>
            )}
            {phase === "connected" && !grid && (
              <div className="absolute right-6 bottom-4 w-32 sm:w-48">
                <Tile name="You" tone="from-stone-800 via-zinc-900 to-black" camOff={!cam} muted={!mic} small />
              </div>
            )}
          </div>

          {/* controls */}
          <div className="relative z-10 flex items-center justify-center gap-2 p-5 sm:gap-3">
            <Ctrl label={mic ? "Mute" : "Unmute"} active={!mic} onClick={() => setMic(!mic)}>
              {mic ? <MicIcon /> : <MicOffIcon />}
            </Ctrl>
            <Ctrl label={cam ? "Turn camera off" : "Turn camera on"} active={!cam} onClick={() => setCam(!cam)}>
              {cam ? <VideoIcon /> : <VideoOffIcon />}
            </Ctrl>
            <Ctrl label="Share screen" active={sharing} onClick={() => setSharing(!sharing)} disabled={phase !== "connected"}>
              <ScreenShareIcon />
            </Ctrl>
            <Ctrl label={grid ? "Speaker view" : "Grid view"} active={grid} onClick={() => setGrid(!grid)} disabled={phase !== "connected"}>
              <LayoutGridIcon />
            </Ctrl>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={end} className="h-12 rounded-full bg-red-600 px-6 text-white hover:bg-red-500" aria-label="End call">
                  <PhoneIcon className="rotate-[135deg]" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>End call</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Tile({
  name,
  tone,
  big,
  small,
  camOff,
  muted,
  speaking,
}: {
  name: string;
  tone: string;
  big?: boolean;
  small?: boolean;
  camOff?: boolean;
  muted?: boolean;
  speaking?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative grid h-full min-h-0 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br ring-1 ring-white/10",
        tone,
        small && "aspect-video h-auto shadow-2xl",
        speaking && "ring-2 ring-gold/70",
      )}
    >
      {camOff ? (
        <span className="grid size-12 place-items-center rounded-full bg-white/10 text-white/80">
          <UserRoundIcon className="size-6" />
        </span>
      ) : (
        <span
          className={cn(
            "grid place-items-center rounded-full bg-white/10 font-display font-bold text-white/90",
            big ? "size-32 text-4xl" : small ? "size-10 text-sm" : "size-20 text-2xl",
          )}
        >
          {initials(name)}
        </span>
      )}
      <span className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-md bg-black/50 px-2 py-1 text-xs text-white backdrop-blur">
        {muted && <MicOffIcon className="size-3" />}
        {name}
      </span>
    </div>
  );
}

function Ctrl({
  label,
  active,
  onClick,
  disabled,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          aria-label={label}
          aria-pressed={active}
          onClick={onClick}
          disabled={disabled}
          className={cn(
            "size-12 rounded-full bg-white/10 text-white hover:bg-white/20 [&_svg]:size-5",
            active && "bg-white text-black hover:bg-white/90",
          )}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
