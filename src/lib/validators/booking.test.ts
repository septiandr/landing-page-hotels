import { describe, expect, it } from "vitest";
import {
  bookingRequestSchema,
  bookingStatusActionSchema,
  createOnsiteBookingSchema,
  getNightsBetween,
  widgetSearchSchema,
} from "./booking";

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

describe("createOnsiteBookingSchema (OSB-007)", () => {
  const valid = {
    roomTypeId: "room-1",
    checkIn: "2026-09-01",
    checkOut: "2026-09-03",
    adults: 2,
    kids: 0,
    guestName: "Budi Santoso",
    guestPhone: "081234567890",
    pricePerNight: 500000,
  };

  it("valid walk-in booking", () => {
    const r = createOnsiteBookingSchema.safeParse(valid);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.kids).toBe(0);
    }
  });

  it("checkout sebelum checkin → error checkout", () => {
    const r = createOnsiteBookingSchema.safeParse({ ...valid, checkOut: "2026-08-31" });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.path[0] === "checkOut")).toBe(true);
    }
  });

  it("nama tamu kosong → error", () => {
    const r = createOnsiteBookingSchema.safeParse({ ...valid, guestName: "  " });
    expect(r.success).toBe(false);
  });

  it("phone tidak valid → error", () => {
    const r = createOnsiteBookingSchema.safeParse({ ...valid, guestPhone: "123" });
    expect(r.success).toBe(false);
  });

  it("harga 0 → error", () => {
    const r = createOnsiteBookingSchema.safeParse({ ...valid, pricePerNight: 0 });
    expect(r.success).toBe(false);
  });

  it("maks 60 malam", () => {
    const r = createOnsiteBookingSchema.safeParse({
      ...valid,
      checkOut: "2026-11-15",
    });
    expect(r.success).toBe(false);
  });

  it("field tak dikenal ditolak (.strict)", () => {
    const r = createOnsiteBookingSchema.safeParse({ ...valid, hack: true });
    expect(r.success).toBe(false);
  });

  it("email opsional invalid → error", () => {
    const r = createOnsiteBookingSchema.safeParse({ ...valid, guestEmail: "bukan-email" });
    expect(r.success).toBe(false);
  });
});

describe("bookingStatusActionSchema (OSB-007)", () => {
  it("aksi valid", () => {
    expect(bookingStatusActionSchema.safeParse("CHECK_IN").success).toBe(true);
    expect(bookingStatusActionSchema.safeParse("CANCEL").success).toBe(true);
  });
  it("aksi tak dikenal ditolak", () => {
    expect(bookingStatusActionSchema.safeParse("REFUND").success).toBe(false);
  });
});
