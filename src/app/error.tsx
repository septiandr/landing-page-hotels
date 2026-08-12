"use client";

import { RotateCcw } from "lucide-react";

/** LP-018 — Error boundary 500: pesan + retry + kontak (PRD §64). */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-surface px-4 py-24">
      <div className="text-center">
        <p className="font-display text-7xl font-bold text-primary-200">500</p>
        <h1 className="mt-4 font-display text-2xl font-semibold text-ink sm:text-3xl">
          Terjadi Kesalahan
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted">
          Maaf, sesuatu tidak berjalan dengan baik. Silakan coba lagi — atau
          hubungi kami jika masalah berlanjut.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-8 inline-flex h-11 items-center gap-2 rounded-lg bg-primary-700 px-6 text-sm font-semibold text-white transition hover:bg-primary-800"
        >
          <RotateCcw className="h-4 w-4" aria-hidden /> Try Again
        </button>
      </div>
    </main>
  );
}
