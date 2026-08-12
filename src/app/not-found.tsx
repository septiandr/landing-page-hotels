import Link from "next/link";

/** LP-018 — Halaman 404 (PRD §64): on-brand dengan navigasi lanjutan. */
export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-surface px-4 py-24">
      <div className="text-center">
        <p className="font-display text-7xl font-bold text-primary-200">404</p>
        <h1 className="mt-4 font-display text-2xl font-semibold text-ink sm:text-3xl">
          Halaman Tidak Ditemukan
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted">
          Sepertinya halaman yang Anda cari sudah dipindahkan atau tidak pernah ada.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-primary-700 px-6 text-sm font-semibold text-white transition hover:bg-primary-800"
          >
            Go Home
          </Link>
          <Link
            href="/#rooms"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-white px-6 text-sm font-medium text-ink transition hover:bg-surface-muted"
          >
            View Rooms
          </Link>
          <Link
            href="/#booking"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-border bg-white px-6 text-sm font-medium text-ink transition hover:bg-surface-muted"
          >
            Book Now
          </Link>
        </div>
      </div>
    </main>
  );
}
