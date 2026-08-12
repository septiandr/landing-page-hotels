import { db } from "@/lib/db";
import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { Benefits } from "@/components/landing/Benefits";

// Landing page M2: section berikutnya menyusul (LP-005..LP-019).
export const dynamic = "force-dynamic";

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

export default async function HomePage() {
  const [hotel, benefits, heroImage, cheapestRoom] = await Promise.all([
    fetchOrNull(db.hotel.findFirst()),
    fetchOrEmpty(db.benefit.findMany({ orderBy: { sortOrder: "asc" } })),
    fetchOrNull(
      db.galleryItem.findFirst({
        where: {
          status: "PUBLISHED",
          category: { in: ["EXTERIOR", "SURROUNDINGS", "ALL"] },
        },
        orderBy: { sortOrder: "asc" },
      }),
    ),
    fetchOrNull(
      db.room.findFirst({
        where: { status: "PUBLISHED" },
        orderBy: { priceFrom: "asc" },
      }),
    ),
  ]);

  const hotelName = hotel?.name ?? "Hotel Direct Booking";
  const tagline =
    hotel?.tagline ?? "A peaceful escape surrounded by comfort, culture and unforgettable experiences.";
  const currency = hotel?.currency ?? "IDR";

  return (
    <>
      <Header hotelName={hotelName} />
      <main>
        <Hero
          hotelName={hotelName}
          tagline={tagline}
          heroImage={heroImage?.image ?? hotel?.logo ?? null}
          cheapestPrice={
            cheapestRoom?.priceFrom != null
              ? { price: Number(cheapestRoom.priceFrom), currency }
              : null
          }
        />

        {/* Anchor booking widget — diisi task BK-001 (M2 berikutnya). */}
        <div id="booking" className="scroll-mt-24" />

        <Benefits benefits={benefits} />
      </main>
    </>
  );
}
