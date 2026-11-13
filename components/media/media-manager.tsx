"use client";

import { useRef, useState } from "react";
import { ImageIcon, LockIcon, Trash2Icon, UploadCloudIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import { people, type MediaItem } from "@/lib/mock-data";
import { STAGES, type Stage } from "@/lib/stages";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MediaThumb, EmptyState } from "@/components/shared/ui-bits";

const MAX_IMAGE = 10 * 1024 * 1024;
const MAX_VIDEO = 100 * 1024 * 1024;
const TONES = ["from-sky-900 via-slate-800 to-black", "from-amber-900 via-stone-800 to-black", "from-emerald-950 via-zinc-800 to-black", "from-indigo-950 via-slate-800 to-black"];

type Uploading = { id: string; name: string; progress: number };

export function MediaManager({
  initial,
  uploaderId,
  kind,
  title,
  description,
  canUpload = true,
}: {
  initial: MediaItem[];
  uploaderId: string;
  kind: "site" | "progress";
  title: string;
  description: string;
  canUpload?: boolean;
}) {
  const [items, setItems] = useState<MediaItem[]>(initial);
  const [uploading, setUploading] = useState<Uploading[]>([]);
  const [drag, setDrag] = useState(false);
  const [viewing, setViewing] = useState<MediaItem | null>(null);
  const [stage, setStage] = useState<Stage>("site_survey");
  const input = useRef<HTMLInputElement>(null);

  const accept = (files: File[]) => {
    for (const f of files) {
      const isVideo = f.type.startsWith("video/");
      const isImage = f.type.startsWith("image/");
      if (!isVideo && !isImage) {
        toast.error(`${f.name} isn't a photo or video`);
        continue;
      }
      if ((isImage && f.size > MAX_IMAGE) || (isVideo && f.size > MAX_VIDEO)) {
        toast.error(`${f.name} is too large`, { description: isImage ? "Photos can be up to 10 MB." : "Videos can be up to 100 MB." });
        continue;
      }
      const id = `up-${Date.now()}-${f.name}`;
      setUploading((u) => [...u, { id, name: f.name, progress: 0 }]);
      const timer = setInterval(() => {
        setUploading((u) => u.map((x) => (x.id === id ? { ...x, progress: Math.min(100, x.progress + 12 + Math.random() * 18) } : x)));
      }, 220);
      setTimeout(() => {
        clearInterval(timer);
        setUploading((u) => u.filter((x) => x.id !== id));
        setItems((it) => [
          {
            id,
            kind,
            type: isVideo ? "video" : "image",
            title: f.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
            stage: kind === "progress" ? stage : undefined,
            uploadedBy: uploaderId,
            at: new Date(),
            size: `${(f.size / 1024 / 1024).toFixed(1)} MB`,
            tone: TONES[Math.floor(Math.random() * TONES.length)],
          },
          ...it,
        ]);
        toast.success("Uploaded", { description: f.name });
      }, 2000);
    }
  };

  return (
    <div className="space-y-5">
      {canUpload && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            accept(Array.from(e.dataTransfer.files));
          }}
          className={cn(
            "relative rounded-2xl border-2 border-dashed p-8 text-center transition",
            drag ? "border-gold bg-gold-soft" : "border-border bg-card hover:border-gold/50",
          )}
        >
          <span className="mx-auto grid size-14 place-items-center rounded-full border border-gold/40 bg-gold-soft text-gold-text">
            <UploadCloudIcon className="size-6" />
          </span>
          <p className="mt-4 font-semibold">{title}</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
          <div className="mt-5 flex flex-col items-center justify-center gap-2 sm:flex-row">
            {kind === "progress" && (
              <Select value={stage} onValueChange={(v) => setStage(v as Stage)}>
                <SelectTrigger className="w-48" aria-label="Stage">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGES.filter((s) => ["site_survey", "installation", "completed"].includes(s.id)).map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button variant="outline" onClick={() => input.current?.click()}>
              Choose files
            </Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Photos up to 10 MB · Videos up to 100 MB · JPG, PNG, HEIC, MP4, MOV</p>
          <input
            ref={input}
            type="file"
            multiple
            accept="image/*,video/*"
            className="hidden"
            onChange={(e) => {
              accept(Array.from(e.target.files ?? []));
              e.target.value = "";
            }}
          />
        </div>
      )}

      {uploading.length > 0 && (
        <ul className="space-y-2">
          {uploading.map((u) => (
            <li key={u.id} className="rounded-xl border bg-card p-3">
              <div className="flex justify-between text-sm">
                <span className="truncate">{u.name}</span>
                <span className="text-muted-foreground tabular-nums">{Math.round(u.progress)}%</span>
              </div>
              <Progress value={u.progress} className="mt-2" />
            </li>
          ))}
        </ul>
      )}

      {items.length === 0 ? (
        <EmptyState icon={ImageIcon} title="Nothing here yet" description="Uploaded photos and videos will appear here." />
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {items.map((m) => (
            <li key={m.id}>
              <button onClick={() => setViewing(m)} className="group block w-full text-left">
                <MediaThumb type={m.type} tone={m.tone} className="transition group-hover:ring-2 group-hover:ring-gold" />
                <p className="mt-2 truncate text-sm font-medium capitalize">{m.title}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(m.at, { day: "numeric", month: "short" })} · {m.size}
                  {m.stage && ` · ${STAGES.find((s) => s.id === m.stage)?.label}`}
                </p>
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <LockIcon className="size-3" /> Private: only you, your advisor and our team can view these files.
      </p>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="sm:max-w-2xl">
          {viewing && (
            <>
              <DialogHeader>
                <DialogTitle className="capitalize">{viewing.title}</DialogTitle>
                <DialogDescription>
                  Uploaded by {people[viewing.uploadedBy]?.name ?? "you"} · {formatDate(viewing.at)} · {viewing.size}
                </DialogDescription>
              </DialogHeader>
              <MediaThumb type={viewing.type} tone={viewing.tone} className="aspect-video" />
              {viewing.uploadedBy === uploaderId && (
                <div className="flex justify-end">
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setItems((it) => it.filter((x) => x.id !== viewing.id));
                      setViewing(null);
                      toast("File deleted");
                    }}
                  >
                    <Trash2Icon /> Delete
                  </Button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
