import { db } from "@/lib/db";
import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { Benefits } from "@/components/landing/Benefits";
import { HotelIntro } from "@/components/landing/HotelIntro";
import { RoomList } from "@/components/landing/RoomList";
import { Amenities } from "@/components/landing/Amenities";
import { Gallery } from "@/components/landing/Gallery";
import { Experiences } from "@/components/landing/Experiences";
import { Promotions } from "@/components/landing/Promotions";
import { Reviews } from "@/components/landing/Reviews";
import { Location } from "@/components/landing/Location";
import { Attractions } from "@/components/landing/Attractions";
import { Awards } from "@/components/landing/Awards";
import { Transportation } from "@/components/landing/Transportation";
import { Faq } from "@/components/landing/Faq";
import { FinalCta } from "@/components/landing/FinalCta";
import { Footer } from "@/components/landing/Footer";
import { PreviewBanner } from "@/components/landing/preview-banner";
import { MobileBookingBar } from "@/components/landing/MobileBookingBar";
import { BookingWidget } from "@/components/booking/BookingWidget";
import { isPreviewMode } from "@/lib/preview";
import { getFromPriceFromEngine } from "@/lib/booking-engine/from-price";
import { getActivePromotions } from "@/lib/promotions";
import type { HighlightStat } from "@/components/landing/HotelIntro";

// LP-001: preview mode (CMS-U-012) membutuhkan rendering dinamis — halaman
// publik tetap query efisien (satu round-trip Promise.all, tanpa N+1).
export const dynamic = "force-dynamic";

interface HomePageProps {
  searchParams: Promise<{ preview?: string }>;
}

/** Helper: graceful fallback dengan logging — error DB tidak menggagalkan landing page. */
async function fetchOrNull<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise;
  } catch (error) {
    console.error("[landing] query gagal, pakai fallback:", error);
    return null;
  }
}

async function fetchOrEmpty<T>(promise: Promise<T[]>): Promise<T[]> {
  try {
    return await promise;
  } catch (error) {
    console.error("[landing] query gagal, pakai fallback kosong:", error);
    return [];
  }
}

export default async function HomePage({ searchParams }: HomePageProps) {
  // Preview mode (CMS-U-012): tampilkan draft hanya dengan ?preview=1 + session valid.
  const preview = await isPreviewMode(await searchParams);

  const now = new Date();

  const [
    hotel,
    benefits,
    heroImage,
    cheapestRoom,
    rooms,
    amenities,
    galleryItems,
    testimonials,
    reviews,
    experiences,
    attractions,
    awards,
    transports,
    faqItems,
    promotions,
  ] = await Promise.all([
    fetchOrNull(db.hotel.findFirst()),
    fetchOrEmpty(db.benefit.findMany({ orderBy: { sortOrder: "asc" } })),
    fetchOrNull(
      db.galleryItem.findFirst({
        where: preview
          ? { category: { in: ["EXTERIOR", "SURROUNDINGS", "ALL"] } }
          : { status: "PUBLISHED", category: { in: ["EXTERIOR", "SURROUNDINGS", "ALL"] } },
        orderBy: { sortOrder: "asc" },
      }),
    ),
    fetchOrNull(
      db.room.findFirst({
        where: preview ? {} : { status: "PUBLISHED" },
        orderBy: { priceFrom: "asc" },
      }),
    ),
    fetchOrEmpty(
      db.room.findMany({
        where: preview ? {} : { status: "PUBLISHED" },
        orderBy: { sortOrder: "asc" },
        include: {
          photos: { orderBy: { sortOrder: "asc" } },
          amenities: true,
        },
      }),
    ),
    fetchOrEmpty(db.amenity.findMany({ orderBy: { sortOrder: "asc" } })),
    fetchOrEmpty(
      db.galleryItem.findMany({
        where: preview ? {} : { status: "PUBLISHED" },
        orderBy: { sortOrder: "asc" },
      }),
    ),
    fetchOrEmpty(
      db.testimonial.findMany({
        where: preview ? {} : { status: "PUBLISHED" },
        orderBy: { publishedAt: "desc" },
      }),
    ),
    fetchOrEmpty(db.review.findMany({ orderBy: { updatedAt: "desc" } })),
    fetchOrEmpty(
      db.experience.findMany({
        where: preview ? {} : { status: "PUBLISHED" },
        orderBy: { sortOrder: "asc" },
      }),
    ),
    fetchOrEmpty(db.attraction.findMany({ orderBy: { sortOrder: "asc" } })),
    fetchOrEmpty(db.award.findMany({ orderBy: { sortOrder: "asc" } })),
    fetchOrEmpty(db.transportOption.findMany({ orderBy: { sortOrder: "asc" } })),
    fetchOrEmpty(db.faqItem.findMany({ orderBy: { sortOrder: "asc" } })),
    getActivePromotions(now, { preview }).catch(() => []),
  ]);

  // BK-010: harga "From" dari engine (cache 10 menit) dengan fallback CMS.
  const enginePrice = await fetchOrNull(getFromPriceFromEngine());

  const hotelName = hotel?.name ?? "Hotel Direct Booking";
  const tagline =
    hotel?.tagline ?? "A peaceful escape surrounded by comfort, culture and unforgettable experiences.";
  const currency = hotel?.currency ?? "IDR";
  const whatsapp = hotel?.whatsapp;
  const socialLinks = hotel?.socialLinks as Record<string, string> | null;

  // LP-005: stat highlights di-drive dari data nyata (tanpa angka hardcode).
  const stats: HighlightStat[] = [];
  if (rooms.length > 0) {
    stats.push({ icon: "rooms", value: String(rooms.length), label: "Rooms & Suites" });
  }
  if (hotel?.checkInTime) {
    stats.push({ icon: "checkin", value: hotel.checkInTime, label: "Check-in Time" });
  }
  const nearest = attractions.reduce<AttractionMin | null>(
    (min, a) =>
      a.travelTimeMin != null && (min === null || a.travelTimeMin < min.travelTimeMin)
        ? { travelTimeMin: a.travelTimeMin }
        : min,
    null,
  );
  if (nearest) {
    stats.push({ icon: "nearby", value: `${nearest.travelTimeMin} min`, label: "to Nearest Attraction" });
  }
  if (amenities.length > 0) {
    stats.push({ icon: "amenities", value: String(amenities.length), label: "Facilities" });
  }

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  const priceForBar =
    enginePrice ??
    (cheapestRoom?.priceFrom != null
      ? { price: Number(cheapestRoom.priceFrom), currency }
      : null);

  return (
    <>
      {preview ? <PreviewBanner /> : null}
      <Header hotelName={hotelName} />
      <main>
        <Hero
          hotelName={hotelName}
          tagline={tagline}
          heroImage={heroImage?.image ?? hotel?.logo ?? null}
          cheapestPrice={priceForBar}
        />

        <Benefits benefits={benefits} />

        <HotelIntro hotelName={hotelName} story={hotel?.story} stats={stats} />

        {/* Booking widget (BK-001) — komponen conversion utama. */}
        <div className="py-16">
          <BookingWidget
            whatsapp={whatsapp}
            phone={hotel?.phone}
            hotelCurrency={currency}
          />
        </div>

        <RoomList rooms={rooms} />

        <Amenities amenities={amenities} />

        <Gallery items={galleryItems} />

        <Experiences
          experiences={experiences}
          whatsapp={whatsapp}
          hotelCurrency={currency}
        />

        <Promotions promotions={promotions} />

        <Reviews reviews={reviews} testimonials={testimonials} />

        <Awards awards={awards} />

        <Location
          lat={hotel?.lat}
          lng={hotel?.lng}
          address={hotel?.address}
          hotelName={hotelName}
        />

        <Attractions attractions={attractions} />

        <Transportation
          transports={transports}
          address={hotel?.address}
          hotelCurrency={currency}
        />

        <Faq items={faqItems} />

        <FinalCta backgroundImage={galleryItems[galleryItems.length - 1]?.image ?? null} />

        {faqItems.length > 0 && (
          <script
            type="application/ld+json"
            // JSON.stringify tidak meng-escape `<` — escape manual supaya konten
            // CMS tidak bisa keluar dari tag script (XSS via FAQ answer).
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c"),
            }}
          />
        )}
      </main>

      <Footer
        hotelName={hotelName}
        address={hotel?.address}
        phone={hotel?.phone}
        email={hotel?.email}
        whatsapp={whatsapp}
        socialLinks={socialLinks}
      />

      <MobileBookingBar price={priceForBar} />
    </>
  );
}

interface AttractionMin {
  travelTimeMin: number;
}
