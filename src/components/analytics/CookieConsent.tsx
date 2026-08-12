"use client";

import { useState } from "react";
import Link from "next/link";
import { Cookie } from "lucide-react";

/**
 * SEC-004 — Banner consent cookie (PRD §52).
 * Muncul hanya saat status consent masih "unknown" (belum pernah memilih).
 * - Accept  → simpan "accepted" → Scripts analytics dimuat.
 * - Reject  → simpan "rejected" → Scripts analytics TIDAK dimuat (DoD: tidak
 *   ada request ke google-analytics/facebook di network tab).
 */
export function CookieConsent({ onDecision }: { onDecision: (state: "accepted" | "rejected") => void }) {
  const [closing, setClosing] = useState(false);

  const decide = (state: "accepted" | "rejected") => {
    setClosing(true);
    // Animasi keluar singkat sebelum di-unmount dari DOM.
    window.setTimeout(() => onDecision(state), 250);
  };

  return (
    <aside
      role="region"
      aria-label="Persetujuan cookie"
      aria-live="polite"
      className={`fixed inset-x-4 bottom-4 z-50 mx-auto max-w-2xl rounded-2xl border border-border bg-surface p-5 shadow-xl shadow-primary-950/10 transition-all duration-300 sm:inset-x-auto sm:left-4 sm:right-4 ${
        closing ? "translate-y-6 opacity-0" : "translate-y-0 opacity-100"
      }`}
    >
      <div className="flex items-start gap-4">
        <span className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700 sm:flex">
          <Cookie size={22} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-base font-semibold text-ink">Kami menghargai privasi Anda</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted">
            Kami menggunakan cookie untuk analitik kunjungan dan iklan agar website ini lebih baik.
            Anda dapat menolak — website tetap berfungsi penuh tanpa cookie analitik.{" "}
            <Link href="/privacy" className="font-medium text-primary-700 underline-offset-2 hover:underline">
              Baca Kebijakan Privasi
            </Link>
          </p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => decide("accepted")}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-primary-700 px-5 text-sm font-semibold text-white transition-colors hover:bg-primary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            >
              Terima
            </button>
            <button
              type="button"
              onClick={() => decide("rejected")}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-border px-5 text-sm font-medium text-ink transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            >
              Tolak
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
