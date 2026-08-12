import { db } from "@/lib/db";
import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { Benefits } from "@/components/landing/Benefits";
import { RoomList } from "@/components/landing/RoomList";
import { Gallery } from "@/components/landing/Gallery";
import { Amenities } from "@/components/landing/Amenities";
import { PreviewBanner } from "@/components/landing/preview-banner";
import { MobileBookingBar } from "@/components/landing/MobileBookingBar";
import { BookingWidget } from "@/components/booking/BookingWidget";
import { isPreviewMode } from "@/lib/preview";
import { getFromPriceFromEngine } from "@/lib/booking-engine/from-price";

// Landing page M2: section berikutnya menyusul (LP-005..LP-019).
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

  const [hotel, benefits, heroImage, cheapestRoom, rooms, galleryItems, amenities] =
    await Promise.all([
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
    fetchOrEmpty(
      db.galleryItem.findMany({
        where: preview ? {} : { status: "PUBLISHED" },
        orderBy: { sortOrder: "asc" },
      }),
    ),
    fetchOrEmpty(db.amenity.findMany({ orderBy: { sortOrder: "asc" } })),
  ]);

  // BK-010: harga "From" dari engine (cache 10 menit) dengan fallback CMS.
  const enginePrice = await fetchOrNull(getFromPriceFromEngine());

  const hotelName = hotel?.name ?? "Hotel Direct Booking";
  const tagline =
    hotel?.tagline ?? "A peaceful escape surrounded by comfort, culture and unforgettable experiences.";
  const currency = hotel?.currency ?? "IDR";

  return (
    <>
      {preview ? <PreviewBanner /> : null}
      <Header hotelName={hotelName} />
      <main>
        <Hero
          hotelName={hotelName}
          tagline={tagline}
          heroImage={heroImage?.image ?? hotel?.logo ?? null}
          cheapestPrice={
            enginePrice ??
            (cheapestRoom?.priceFrom != null
              ? { price: Number(cheapestRoom.priceFrom), currency }
              : null)
          }
        />

        <Benefits benefits={benefits} />

        {/* Booking widget (BK-001) — komponen conversion utama. */}
        <div className="py-16">
          <BookingWidget
            whatsapp={hotel?.whatsapp}
            phone={hotel?.phone}
            hotelCurrency={currency}
          />
        </div>

        <RoomList rooms={rooms} />

        <Gallery items={galleryItems} />

        <Amenities amenities={amenities} />
      </main>

      <MobileBookingBar
        price={
          enginePrice ??
          (cheapestRoom?.priceFrom != null
            ? { price: Number(cheapestRoom.priceFrom), currency }
            : null)
        }
      />
    </>
  );
}
