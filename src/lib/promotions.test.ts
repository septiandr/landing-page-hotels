import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Promotion } from "@/generated/prisma/client";

const { mockFindMany } = vi.hoisted(() => ({ mockFindMany: vi.fn() }));

vi.mock("@/lib/db", () => ({
  db: { promotion: { findMany: mockFindMany } },
}));

import { getActivePromotions, getPromotionStatus, isPromotionVisible } from "./promotions";

const NOW = new Date("2026-08-12T10:00:00Z");

function promo(overrides: Partial<{ status: "ACTIVE" | "SCHEDULED" | "DRAFT" | "EXPIRED"; bookingStart: Date | null; bookingEnd: Date | null }> = {}) {
  return {
    status: "ACTIVE",
    bookingStart: null,
    bookingEnd: null,
    ...overrides,
  } as const;
}

describe("getPromotionStatus", () => {
  it("ACTIVE dalam periode → ACTIVE", () => {
    expect(
      getPromotionStatus(
        promo({ bookingStart: new Date("2026-08-01"), bookingEnd: new Date("2026-09-01") }),
        NOW,
      ),
    ).toBe("ACTIVE");
  });

  it("bookingEnd lewat → EXPIRED (auto-expire)", () => {
    expect(
      getPromotionStatus(promo({ bookingEnd: new Date("2026-08-01") }), NOW),
    ).toBe("EXPIRED");
  });

  it("SCHEDULED dengan bookingStart lewat → ACTIVE (auto-activate)", () => {
    expect(
      getPromotionStatus(
        promo({ status: "SCHEDULED", bookingStart: new Date("2026-08-01") }),
        NOW,
      ),
    ).toBe("ACTIVE");
  });

  it("SCHEDULED dengan bookingStart masih depan → SCHEDULED", () => {
    expect(
      getPromotionStatus(
        promo({ status: "SCHEDULED", bookingStart: new Date("2026-09-01") }),
        NOW,
      ),
    ).toBe("SCHEDULED");
  });

  it("DRAFT tetap DRAFT walau dalam periode", () => {
    expect(
      getPromotionStatus(
        promo({ status: "DRAFT", bookingStart: new Date("2026-08-01") }),
        NOW,
      ),
    ).toBe("DRAFT");
  });

  it("ACTIVE tanpa tanggal → ACTIVE", () => {
    expect(getPromotionStatus(promo(), NOW)).toBe("ACTIVE");
  });

  it("isPromotionVisible konsisten dengan status", () => {
    expect(isPromotionVisible(promo({ status: "DRAFT" }), NOW)).toBe(false);
    expect(isPromotionVisible(promo(), NOW)).toBe(true);
  });
});

describe("getActivePromotions", () => {
  beforeEach(() => {
    mockFindMany.mockReset();
  });

  it("hanya mengembalikan promotion yang terlihat saat ini", async () => {
    mockFindMany.mockResolvedValue([
      { id: "1", status: "ACTIVE", bookingStart: null, bookingEnd: null },
      { id: "2", status: "ACTIVE", bookingStart: null, bookingEnd: new Date("2026-08-01") },
      { id: "3", status: "SCHEDULED", bookingStart: new Date("2026-08-01"), bookingEnd: null },
      { id: "4", status: "SCHEDULED", bookingStart: new Date("2026-09-01"), bookingEnd: null },
    ] as unknown as Promotion[]);

    const result = await getActivePromotions(NOW);
    expect(result.map((p) => p.id)).toEqual(["1", "3"]);
  });
});
