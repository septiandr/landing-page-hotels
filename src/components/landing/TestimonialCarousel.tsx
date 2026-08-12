"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Quote, Star } from "lucide-react";
import type { Testimonial } from "@/generated/prisma/client";
import { formatDate } from "@/lib/format";

const AUTO_MS = 5000;

/**
 * LP-011 — Testimonial carousel.
 * Auto-advance + manual, pause on hover/focus (a11y), keyboard navigable
 * (prev/next via tombol focusable), dots indicator.
 */
export function TestimonialCarousel({
  testimonials,
}: {
  testimonials: Testimonial[];
}) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<number | null>(null);
  const count = testimonials.length;

  useEffect(() => {
    if (paused || count <= 1) return;
    timerRef.current = window.setInterval(() => {
      setActive((prev) => (prev + 1) % count);
    }, AUTO_MS);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [paused, count]);

  const prev = () => setActive((i) => (i - 1 + count) % count);
  const next = () => setActive((i) => (i + 1) % count);

  if (count === 0) return null;

  return (
    <div
      className="relative mx-auto max-w-3xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div
        className="overflow-hidden rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8"
        aria-live="polite"
      >
        <Quote className="h-8 w-8 text-primary-100" aria-hidden />
        {testimonials.map((t, i) => (
          <figure
            key={t.id}
            aria-hidden={i !== active}
            className={i === active ? "block" : "hidden"}
          >
            <div
              className="mt-3 flex items-center gap-0.5"
              role="img"
              aria-label={`${t.rating} dari 5 bintang`}
            >
              {Array.from({ length: 5 }, (_, s) => (
                <Star
                  key={s}
                  size={16}
                  aria-hidden
                  className={
                    s < t.rating
                      ? "fill-accent-500 text-accent-500"
                      : "text-surface-muted"
                  }
                />
              ))}
            </div>
            <blockquote className="mt-3 text-base leading-relaxed text-ink sm:text-lg">
              “{t.review}”
            </blockquote>
            <figcaption className="mt-5 text-sm text-muted">
              <span className="font-semibold text-ink">{t.guestName}</span>
              {t.country ? ` · ${t.country}` : ""}
              {t.source ? (
                <>
                  {" "}
                  · via <span className="font-medium text-primary-700">{t.source}</span>
                </>
              ) : null}
              {t.publishedAt ? (
                <span className="ml-2 text-xs">({formatDate(t.publishedAt, "MMM yyyy")})</span>
              ) : null}
            </figcaption>
          </figure>
        ))}
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Testimoni sebelumnya"
            className="absolute -left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white text-ink shadow-sm transition hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 sm:-left-5"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Testimoni berikutnya"
            className="absolute -right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white text-ink shadow-sm transition hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 sm:-right-5"
          >
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>

          <div className="mt-5 flex justify-center gap-2">
            {testimonials.map((t, i) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Tampilkan testimoni ${i + 1}`}
                aria-current={i === active}
                className={`h-2 rounded-full transition-all ${
                  i === active
                    ? "w-6 bg-primary-700"
                    : "w-2 bg-border hover:bg-ink-soft"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
