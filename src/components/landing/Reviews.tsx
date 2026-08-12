import { ExternalLink, Star } from "lucide-react";
import type { Review, Testimonial } from "@/generated/prisma/client";
import { computeReviewSummary, normalizeRating } from "@/lib/reviews";
import { TestimonialCarousel } from "./TestimonialCarousel";

/**
 * LP-011 — Reviews & Testimonials (PRD §21).
 * Ringkasan rating dihitung dari tabel Review (rating rata-rata tertimbang
 * per jumlah review per sumber), sumber selalu ditampilkan.
 */
export function Reviews({
  reviews,
  testimonials,
}: {
  reviews: Review[];
  testimonials: Testimonial[];
}) {
  if (reviews.length === 0 && testimonials.length === 0) return null;

  const { totalCount, overall } = computeReviewSummary(reviews);

  return (
    <section id="reviews" className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-primary-700">
          Guest Reviews
        </p>
        <h2 className="mt-3 text-center font-display text-3xl font-semibold text-ink sm:text-4xl">
          Loved by Our Guests
        </h2>

        {totalCount > 0 && (
          <div className="mx-auto mt-10 flex max-w-xl flex-col items-center gap-6 rounded-2xl border border-border bg-surface p-6 sm:flex-row sm:justify-between">
            <div className="text-center sm:text-left">
              <div
                className="flex items-center justify-center gap-1 sm:justify-start"
                role="img"
                aria-label={`Rating ${overall} dari 5`}
              >
                {Array.from({ length: 5 }, (_, s) => (
                  <Star
                    key={s}
                    size={18}
                    aria-hidden
                    className={
                      s < Math.round(overall)
                        ? "fill-accent-500 text-accent-500"
                        : "text-border"
                    }
                  />
                ))}
              </div>
              <p className="mt-2 font-display text-2xl font-semibold text-ink">
                {overall.toFixed(1)} <span className="text-base font-normal text-muted">/ 5</span>
              </p>
            </div>
            <ul className="flex flex-wrap justify-center gap-2">
              {reviews.map((review) => (
                <li key={review.id}>
                  <a
                    href={review.url ?? undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-xs font-medium text-ink-soft transition hover:border-primary-300 hover:text-primary-700"
                  >
                    {review.source}
                    <span className="font-semibold text-primary-700">
                      {normalizeRating(Number(review.rating)).toFixed(1)}
                    </span>
                    <span className="text-muted">({review.count.toLocaleString("id-ID")})</span>
                    {review.url && <ExternalLink size={12} aria-hidden className="text-muted" />}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {testimonials.length > 0 && (
          <div className="mt-12">
            <TestimonialCarousel testimonials={testimonials} />
          </div>
        )}
      </div>
    </section>
  );
}
