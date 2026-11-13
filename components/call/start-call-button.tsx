"use client";

import { VideoIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCall } from "./call-provider";

export function StartCallButton({
  peer,
  label = "Video call",
  className,
  variant = "outline",
  size,
  disabled,
}: {
  peer: string;
  label?: string;
  className?: string;
  variant?: React.ComponentProps<typeof Button>["variant"];
  size?: React.ComponentProps<typeof Button>["size"];
  disabled?: boolean;
}) {
  const { startCall } = useCall();
  return (
    <Button variant={variant} size={size} className={className} disabled={disabled} onClick={() => startCall(peer)}>
      <VideoIcon /> {label}
    </Button>
  );
}
