import type { Benefit } from "@/generated/prisma/client";
import { getIcon } from "./icon-map";

export function Benefits({ benefits }: { benefits: Benefit[] }) {
  if (benefits.length === 0) return null;

  return (
    <section className="bg-surface-muted py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-primary-700">
          Book Direct &amp; Get More
        </p>
        <h2 className="mt-3 text-center font-display text-3xl font-semibold text-ink sm:text-4xl">
          Why Book Direct?
        </h2>
        {/* A11Y: text-ink-soft — text-muted (4.4:1) di bawah AA di atas bg-surface-muted. */}
        <p className="mx-auto mt-4 max-w-xl text-center text-base text-ink-soft">
          Booking langsung melalui website resmi memberi kamu lebih banyak nilai dibanding OTA.
        </p>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((benefit) => {
            const Icon = getIcon(benefit.icon);
            return (
              <article
                key={benefit.id}
                className="group rounded-2xl border border-border bg-surface p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary-900/5"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-700 transition-colors group-hover:bg-primary-700 group-hover:text-white">
                  <Icon size={22} aria-hidden />
                </div>
                <h3 className="mt-4 font-semibold text-ink">{benefit.title}</h3>
                {benefit.description && (
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{benefit.description}</p>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
