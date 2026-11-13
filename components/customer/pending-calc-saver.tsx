"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveCalculation } from "@/lib/actions";

export const PENDING_CALC_KEY = "solar:pendingCalc";

/** After sign-up (email or Google), saves the estimate the visitor built on the calculator. */
export function PendingCalcSaver() {
  const router = useRouter();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(PENDING_CALC_KEY);
    } catch {
      return;
    }
    if (!raw) return;
    let draft: unknown;
    try {
      draft = JSON.parse(raw);
    } catch {
      localStorage.removeItem(PENDING_CALC_KEY);
      return;
    }
    saveCalculation(draft).then((res) => {
      if (res.ok) {
        try {
          localStorage.removeItem(PENDING_CALC_KEY);
        } catch {}
        toast.success("Estimate saved to your account", { description: "Your advisor will start from this." });
        router.refresh();
      } else {
        toast.error("Couldn't save your estimate", { description: res.error });
      }
    });
  }, [router]);

  return null;
}
