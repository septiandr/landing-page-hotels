import { describe, expect, it } from "vitest";
import { buildBookingUrl, buildDeepLinkUrl } from "./deep-link";

describe("buildDeepLinkUrl (BK-008)", () => {
  const base = {
    checkIn: "2026-09-01",
    checkOut: "2026-09-03",
    adults: 2,
    kids: 1,
    rooms: 1,
  };

  it("URL engine dengan tanggal & guests", () => {
    const url = new URL(buildDeepLinkUrl("ABC123", base));
    expect(url.host).toBe("hotels.cloudbeds.com");
    expect(url.pathname).toBe("/reservation/ABC123");
    expect(url.searchParams.get("checkin")).toBe("2026-09-01");
    expect(url.searchParams.get("checkout")).toBe("2026-09-03");
    expect(url.searchParams.get("adults")).toBe("2");
    expect(url.searchParams.get("kids")).toBe("1");
  });

  it("promo code → param promo (BK-011)", () => {
    const url = new URL(buildDeepLinkUrl("ABC123", { ...base, promoCode: "WELCOME10" }));
    expect(url.searchParams.get("promo")).toBe("WELCOME10");
  });

  it("room_type → base_rates_only=1 (jika ada abbr)", () => {
    const url = new URL(buildDeepLinkUrl("ABC123", { ...base, roomType: "DLX" }));
    expect(url.searchParams.get("room_type")).toBe("DLX");
    expect(url.searchParams.get("base_rates_only")).toBe("1");
  });

  it("rooms > 1 dikirim, rooms=1 tidak", () => {
    expect(new URL(buildDeepLinkUrl("ABC123", { ...base, rooms: 3 })).searchParams.get("rooms")).toBe("3");
    expect(new URL(buildDeepLinkUrl("ABC123", base)).searchParams.get("rooms")).toBeNull();
  });

  it("tanpa promo/roomType → param opsional tidak ada", () => {
    const url = new URL(buildDeepLinkUrl("ABC123", base));
    expect(url.searchParams.get("promo")).toBeNull();
    expect(url.searchParams.get("room_type")).toBeNull();
  });
});

describe("buildBookingUrl (env)", () => {
  it("return null saat NEXT_PUBLIC_CLOUDBEDS_PROPERTY_CODE kosong (fallback WhatsApp)", () => {
    expect(
      buildBookingUrl({
        checkIn: "2026-09-01",
        checkOut: "2026-09-03",
        adults: 2,
        kids: 0,
        rooms: 1,
      }),
    ).toBeNull();
  });
});
