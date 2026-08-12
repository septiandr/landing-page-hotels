import type { FaqItem, Hotel, Review, Room } from "@/generated/prisma/client";
import { computeReviewSummary } from "@/lib/reviews";
import { absoluteUrl, siteUrl } from "./url";

/** Room bisa disertai relasi photos (opsional). */
type RoomWithPhotos = Room & { photos?: Array<{ url?: string | null }> };

/**
 * SEO-004 — Builder JSON-LD type-safe.
 * Semua output di-serialize lewat `jsonLdScript()` yang meng-escape `<`
 * (JSON.stringify tidak meng-escape — konten CMS tidak boleh keluar dari
 * tag <script>, XSS).
 *
 * Rule PRD §40: data harus NYATA — AggregateRating hanya jika tabel Review
 * ada isinya (via computeReviewSummary).
 */

export type JsonLd = Record<string, unknown>;

/** Serialize + escape untuk <script type="application/ld+json">. */
export function jsonLdScript(data: JsonLd): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function hotelJsonLd(hotel: Hotel, reviews: Review[] = []): JsonLd {
  const image = absoluteUrl(hotel.logo);
  const summary = computeReviewSummary(reviews);

  const ld: JsonLd = {
    "@context": "https://schema.org",
    "@type": ["Hotel", "LocalBusiness"],
    name: hotel.name,
    description: hotel.description ?? hotel.tagline ?? undefined,
    image: image ? [image] : undefined,
    address: hotel.address
      ? { "@type": "PostalAddress", streetAddress: hotel.address }
      : undefined,
    telephone: hotel.phone ?? undefined,
    email: hotel.email ?? undefined,
    // Konsisten dengan canonical (getHotelMetadata) & sitemap: tanpa trailing slash.
    url: siteUrl(),
    priceRange: hotel.currency ? `${hotel.currency}` : undefined,
    checkinTime: hotel.checkInTime,
    checkoutTime: hotel.checkOutTime,
    ...(hotel.lat != null && hotel.lng != null
      ? { geo: { "@type": "GeoCoordinates", latitude: hotel.lat, longitude: hotel.lng } }
      : {}),
  };

  if (summary.totalCount > 0) {
    ld.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: summary.overall,
      reviewCount: summary.totalCount,
      bestRating: 5,
    };
  }

  return ld;
}

export function roomJsonLd(room: RoomWithPhotos, hotelName: string, reviews: Review[] = []): JsonLd {
  const summary = computeReviewSummary(reviews);
  const photoUrl = room.photos?.[0]?.url;
  const image = photoUrl ? absoluteUrl(photoUrl) : undefined;

  const ld: JsonLd = {
    "@context": "https://schema.org",
    "@type": "HotelRoom",
    name: room.name,
    description: room.description ?? undefined,
    url: absoluteUrl(`/rooms/${room.slug}`),
    image: image ? [image] : undefined,
    ...(room.maxOccupancy != null
      ? {
          occupancy: {
            "@type": "QuantitativeValue",
            maxValue: room.maxOccupancy,
            unitCode: "C62",
          },
        }
      : {}),
    ...(room.sizeM2 != null
      ? { floorSize: { "@type": "QuantitativeValue", value: room.sizeM2, unitCode: "MTK" } }
      : {}),
    hotel: {
      "@type": "Hotel",
      name: hotelName,
    },
  };

  if (room.priceFrom != null) {
    ld.offers = {
      "@type": "Offer",
      name: `${room.name} — starting from`,
      price: Number(room.priceFrom),
      priceCurrency: room.currency || "IDR",
      availability: "https://schema.org/InStock",
    };
  }

  if (summary.totalCount > 0) {
    ld.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: summary.overall,
      reviewCount: summary.totalCount,
      bestRating: 5,
    };
  }

  return ld;
}

export function faqJsonLd(faqs: FaqItem[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}
