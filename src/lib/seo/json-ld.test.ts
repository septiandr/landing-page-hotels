import { describe, expect, it } from "vitest";
import { faqJsonLd, hotelJsonLd, jsonLdScript, roomJsonLd } from "./json-ld";

function hotel(overrides: Record<string, unknown> = {}) {
  return {
    id: "h1",
    name: "Taman Sari Heritage Hotel",
    description: "Hotel heritage di Yogyakarta.",
    address: "Jl. Malioboro No. 123",
    checkInTime: "14:00",
    checkOutTime: "12:00",
    lat: -7.7916,
    lng: 110.3666,
    ...overrides,
  } as never;
}

function room(overrides: Record<string, unknown> = {}) {
  return {
    id: "r1",
    slug: "deluxe-king-room",
    name: "Deluxe King Room",
    description: "Kamar nyaman.",
    priceFrom: 850000,
    currency: "IDR",
    maxOccupancy: 2,
    sizeM2: 32,
    photos: [{ id: "p1", url: "/uploads/room.jpg", altText: "room", sortOrder: 1 }],
    ...overrides,
  } as never;
}

describe("jsonLdScript", () => {
  it("meng-escape < supaya konten CMS tidak keluar dari tag script", () => {
    const html = jsonLdScript({ text: "</script><script>alert(1)</script>" });
    expect(html).not.toContain("</script>");
    expect(html).toContain("\\u003c");
  });
});

describe("hotelJsonLd", () => {
  it("bentuk dasar Hotel + LocalBusiness", () => {
    const ld = hotelJsonLd(hotel());
    expect(ld["@type"]).toEqual(["Hotel", "LocalBusiness"]);
    expect(ld.name).toBe("Taman Sari Heritage Hotel");
    expect(ld.geo).toEqual({
      "@type": "GeoCoordinates",
      latitude: -7.7916,
      longitude: 110.3666,
    });
  });

  it("tanpa aggregateRating jika tabel Review kosong (PRD §40: rating nyata)", () => {
    expect(hotelJsonLd(hotel()).aggregateRating).toBeUndefined();
  });

  it("dengan aggregateRating hanya jika ada data review", () => {
    const reviews = [
      { source: "Google", rating: 4.8, count: 1284 },
      { source: "Booking.com", rating: 9.1, count: 876 },
    ] as never[];
    const ld = hotelJsonLd(hotel(), reviews);
    expect(ld.aggregateRating).toMatchObject({
      "@type": "AggregateRating",
      ratingValue: 4.7,
      reviewCount: 2160,
      bestRating: 5,
    });
  });
});

describe("roomJsonLd", () => {
  it("HotelRoom + Offer + occupancy", () => {
    const ld = roomJsonLd(room(), "Hotel");
    expect(ld["@type"]).toBe("HotelRoom");
    expect(ld.offers).toMatchObject({
      "@type": "Offer",
      price: 850000,
      priceCurrency: "IDR",
    });
    expect(ld.occupancy).toMatchObject({ "@type": "QuantitativeValue", maxValue: 2 });
  });

  it("tanpa Offer jika priceFrom kosong", () => {
    expect(roomJsonLd(room({ priceFrom: null }), "Hotel").offers).toBeUndefined();
  });
});

describe("faqJsonLd", () => {
  it("FAQPage dengan mainEntity per pertanyaan", () => {
    const ld = faqJsonLd([
      { id: "1", question: "Q1", answer: "A1", category: "BOOKING", sortOrder: 1 },
      { id: "2", question: "Q2", answer: "A2", category: "HOTEL", sortOrder: 2 },
    ] as never[]);
    expect(ld["@type"]).toBe("FAQPage");
    expect(ld.mainEntity).toHaveLength(2);
  });
});
