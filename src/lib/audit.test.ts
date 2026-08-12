import { describe, expect, it, vi } from "vitest";

// next-auth mengimpor next/server (tidak tersedia di vitest) — mock module.
vi.mock("@/lib/auth", () => ({ auth: vi.fn().mockResolvedValue(null) }));
vi.mock("@/lib/db", () => ({ db: { auditLog: { create: vi.fn() } } }));

import { diffObjects } from "./audit";

describe("diffObjects", () => {
  it("mengembalikan hanya field yang berubah", () => {
    const prev = { name: "Deluxe King Room", priceFrom: 850000, view: "City View" };
    const next = { name: "Deluxe King Room", priceFrom: 800000, view: "City View" };
    const diff = diffObjects(prev, next);
    expect(diff).toEqual({ previous: { priceFrom: 850000 }, next: { priceFrom: 800000 } });
  });

  it("null bila tidak ada perubahan", () => {
    const prev = { name: "A", priceFrom: 100 };
    expect(diffObjects(prev, { name: "A", priceFrom: 100 })).toBeNull();
  });

  it("field baru (null → nilai) ikut di-diff", () => {
    const prev: { name: string; priceFrom: number | null } = { name: "A", priceFrom: null };
    const diff = diffObjects(prev, { priceFrom: 900 });
    expect(diff?.next.priceFrom).toBe(900);
  });
});
