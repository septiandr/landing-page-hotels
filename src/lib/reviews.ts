export interface ReviewLike {
  rating: number | { toString(): string };
  count: number;
}

export interface ReviewSummary {
  totalCount: number;
  /** Rata-rata tertimbang (rating × count) dibulatkan 1 desimal. */
  overall: number;
}

/**
 * Normalisasi rating ke skala 5-bintang: Google/TripAdvisor sudah 5-poin,
 * Booking.com memakai skala 10 → dibagi 2 (PRD §21 menampilkan skala 5).
 */
export function normalizeRating(rating: number): number {
  return rating > 5 ? rating / 2 : rating;
}

/**
 * Ringkasan rating dari tabel Review (LP-011, PRD §21):
 * rata-rata tertimbang per jumlah review per sumber, skala 5-bintang.
 */
export function computeReviewSummary(reviews: ReviewLike[]): ReviewSummary {
  const totalCount = reviews.reduce((sum, r) => sum + r.count, 0);
  if (totalCount === 0) return { totalCount: 0, overall: 0 };
  const weighted =
    reviews.reduce((sum, r) => sum + normalizeRating(Number(r.rating)) * r.count, 0) /
    totalCount;
  return { totalCount, overall: Math.round(weighted * 10) / 10 };
}
