"use client";

import { useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

/** Copy kode promo ke clipboard dengan feedback "Copied!" (LP-010). */
export function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | null>(null);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // Fallback untuk konteks tanpa izin clipboard (iframe non-secure).
      const el = document.createElement("textarea");
      el.value = code;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button
      type="button"
      onClick={onCopy}
      aria-label={`Salin kode ${code}`}
      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs font-medium text-ink-soft transition hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-green-600" aria-hidden /> Copied!
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5" aria-hidden /> Copy
        </>
      )}
    </button>
  );
}
