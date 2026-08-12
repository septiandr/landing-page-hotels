import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Placeholder M1 — section landing page lengkap di M2 (LP-*).
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const hotel = await db.hotel.findFirst().catch(() => null);
  const cheapestRoom = await db.room
    .findFirst({ where: { status: "PUBLISHED" }, orderBy: { priceFrom: "asc" } })
    .catch(() => null);

  const hotelName = hotel?.name ?? "Hotel Direct Booking";
  const tagline =
    hotel?.tagline ?? "Experience Your Stay in Yogyakarta";
  const currency = hotel?.currency ?? "IDR";

  return (
    <main>
      <section className="relative flex min-h-[80svh] flex-col items-center justify-center px-6 py-24 text-center">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-b from-primary-50 via-surface to-surface"
        />
        <Badge>Book Direct &amp; Get More</Badge>
        <h1 className="mt-6 max-w-3xl font-display text-4xl font-semibold leading-tight text-ink sm:text-6xl">
          {hotelName}
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
          {tagline}
        </p>
        {cheapestRoom?.priceFrom != null && (
          <p className="mt-3 text-sm text-muted">
            Kamar mulai dari{" "}
            <span className="font-semibold text-primary-700">
              {formatCurrency(Number(cheapestRoom.priceFrom), currency)}
            </span>
            /malam
          </p>
        )}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg">Check Availability</Button>
          <Button size="lg" variant="outline">
            Explore Rooms
          </Button>
        </div>
      </section>
    </main>
  );
}
