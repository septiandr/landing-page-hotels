import Link from "next/link";

/**
 * Template halaman legal statis (LP-017, PRD §28).
 * Konten di bawah adalah placeholder — tim hotel wajib mengganti dengan teks
 * legal resmi sebelum rilis.
 */
export function LegalPage({ title, sections }: { title: string; sections: string[] }) {
  return (
    <main className="bg-surface py-20 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <Link
          href="/"
          className="text-sm font-medium text-primary-700 transition hover:text-primary-800"
        >
          ← Back to Home
        </Link>
        <h1 className="mt-4 font-display text-3xl font-semibold text-ink sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 rounded-lg border border-accent-200 bg-accent-50 p-3 text-sm text-accent-800">
          ⚠️ Template — konten di bawah hanyalah placeholder dan belum disetujui
          tim legal. Ganti dengan teks resmi sebelum dipublikasikan.
        </p>
        <div className="mt-8 space-y-6">
          {sections.map((paragraph, i) => (
            <p key={i} className="text-sm leading-relaxed text-ink-soft">
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </main>
  );
}
