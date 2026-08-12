import Image from "next/image";
import { Award as AwardIcon } from "lucide-react";
import type { Award } from "@/generated/prisma/client";

/**
 * LP-012 — Awards (PRD §22).
 * Non-critical: section tidak dirender jika tidak ada data.
 */
export function Awards({ awards }: { awards: Award[] }) {
  if (awards.length === 0) return null;

  return (
    <section id="awards" className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-primary-700">
          Recognition
        </p>
        <h2 className="mt-3 text-center font-display text-2xl font-semibold text-ink sm:text-3xl">
          Awards &amp; Accolades
        </h2>

        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {awards.map((award) => (
            <li
              key={award.id}
              className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-5"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
                {award.logo ? (
                  <Image
                    src={award.logo}
                    alt={award.name}
                    width={48}
                    height={48}
                    className="rounded-lg object-contain"
                  />
                ) : (
                  <AwardIcon className="h-6 w-6" aria-hidden />
                )}
              </span>
              <div className="min-w-0">
                <p className="truncate font-display text-base font-semibold text-ink">
                  {award.name}
                </p>
                <p className="mt-0.5 text-sm text-muted">
                  {award.issuer ? `${award.issuer}` : ""}
                  {award.year ? ` · ${award.year}` : ""}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
