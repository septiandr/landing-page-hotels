import { describe, expect, it } from "vitest";
import { bookingRequestSchema, getNightsBetween, widgetSearchSchema } from "./booking";

describe("bookingRequestSchema (BK-005)", () => {
  it("valid request", () => {
    const r = bookingRequestSchema.safeParse({
      checkin: "2026-09-01",
      checkout: "2026-09-03",
      adults: "2",
      kids: "1",
      rooms: "1",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.adults).toBe(2);
    }
  });

  it("checkout sebelum checkin → error checkout", () => {
    const r = bookingRequestSchema.safeParse({
      checkin: "2026-09-03",
      checkout: "2026-09-01",
      adults: 2,
      kids: 0,
      rooms: 1,
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path[0] === "checkout")).toBe(true);
    }
  });

  it("adults 0 → error", () => {
    expect(
      bookingRequestSchema.safeParse({
        checkin: "2026-09-01",
        checkout: "2026-09-02",
        adults: 0,
        kids: 0,
        rooms: 1,
      }).success,
    ).toBe(false);
  });

  it("maks 30 malam", () => {
    expect(
      bookingRequestSchema.safeParse({
        checkin: "2026-09-01",
        checkout: "2026-10-15",
        adults: 2,
        kids: 0,
        rooms: 1,
      }).success,
    ).toBe(false);
  });
});

describe("widgetSearchSchema (BK-001)", () => {
  it("valid", () => {
    expect(
      widgetSearchSchema.safeParse({
        checkIn: "2026-09-01",
        checkOut: "2026-09-02",
        adults: 2,
        kids: 0,
        rooms: 1,
      }).success,
    ).toBe(true);
  });

  it("invalid date → pesan bahasa Indonesia", () => {
    const r = widgetSearchSchema.safeParse({
      checkIn: "2026-09-02",
      checkOut: "2026-09-01",
      adults: 2,
      kids: 0,
      rooms: 1,
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues[0]?.message).toContain("Check-out harus setelah check-in");
    }
  });
});

describe("getNightsBetween", () => {
  it("menghitung malam", () => {
    expect(getNightsBetween("2026-09-01", "2026-09-03")).toBe(2);
    expect(getNightsBetween("2026-09-03", "2026-09-01")).toBe(0);
  });
});
