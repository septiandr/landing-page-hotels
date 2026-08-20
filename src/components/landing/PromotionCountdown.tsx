"use client";

import { useEffect, useState } from "react";
import { Timer } from "lucide-react";
import { formatCountdown } from "@/lib/countdown";

/**
 * LP-010 — Countdown promo (PRD §19). Sinkron dengan `bookingEnd` nyata,
 * interval 1 detik, format "2d 04h 12m 33s". Saat expired memanggil
 * `onExpired` (card promo dihilangkan oleh parent).
 */
export function PromotionCountdown({
  endsAt,
  onExpired,
}: {
  endsAt: string;
  onExpired?: () => void;
}) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const update = () => {
      const ms = msUntil(endsAt);
      setRemaining(ms);
      if (ms <= 0) onExpired?.();
    };
    update();
    const id = window.setInterval(update, 1000);
    return () => window.clearInterval(id);
  }, [endsAt, onExpired]);

  if (remaining === null || remaining <= 0) return null;

  return (
    <div
      className="inline-flex items-center gap-2 rounded-full border border-accent-300 bg-accent-50 px-3.5 py-1.5 text-sm font-semibold text-accent-700"
      role="timer"
      aria-label="Promo berakhir dalam"
    >
      <Timer size={15} aria-hidden />
      {formatCountdown(remaining)}
    </div>
  );
}

function msUntil(iso: string): number {
  const end = new Date(iso).getTime();
  if (Number.isNaN(end)) return 0;
  return end - Date.now();
}
