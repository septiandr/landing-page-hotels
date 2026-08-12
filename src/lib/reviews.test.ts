import { describe, expect, it } from "vitest";
import { computeReviewSummary, normalizeRating, type ReviewLike } from "./reviews";

function review(rating: number, count: number): ReviewLike {
  return { rating, count };
}

describe("computeReviewSummary", () => {
  it("rata-rata tertimbang antar sumber (skala 5)", () => {
    const summary = computeReviewSummary([review(4.5, 1000), review(5, 284)]);
    expect(summary.totalCount).toBe(1284);
    // (4.5*1000 + 5*284) / 1284 = 4.61…
    expect(summary.overall).toBe(4.6);
  });

  it("rating skala 10 (Booking.com) dinormalisasi ke skala 5", () => {
    const summary = computeReviewSummary([review(9.1, 876), review(4.8, 1284)]);
    // (9.1/2*876 + 4.8*1284) / 2160 = 4.70…
    expect(summary.overall).toBe(4.7);
  });

  it("kosong → 0", () => {
    expect(computeReviewSummary([])).toEqual({ totalCount: 0, overall: 0 });
  });
});

describe("normalizeRating", () => {
  it("rating > 5 dibagi 2, sisanya tetap", () => {
    expect(normalizeRating(9.1)).toBe(4.55);
    expect(normalizeRating(4.8)).toBe(4.8);
  });
});
