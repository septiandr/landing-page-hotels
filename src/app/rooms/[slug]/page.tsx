import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BedDouble,
  Check,
  Clock3,
  Coffee,
  Maximize2,
  MessageCircle,
  Ruler,
  Users,
} from "lucide-react";
import { getHotel, getRoomBySlug } from "@/lib/data";
import { db } from "@/lib/db";
import { formatCurrency } from "@/lib/format";
import { buildAvailabilityUrl } from "@/lib/booking/url";
import { EVENTS } from "@/lib/analytics";
import { TrackedLink } from "@/components/analytics/TrackedLink";
import { roomJsonLd, jsonLdScript } from "@/lib/seo/json-ld";
import { Header } from "@/components/landing/Header";
import { PreviewBanner } from "@/components/landing/preview-banner";
import { isPreviewMode } from "@/lib/preview";

interface RoomPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// Halaman dynamic: membaca searchParams untuk preview mode (CMS-U-012) —
// update konten selalu segar (target < 5 menit, PRD §61).

export async function generateMetadata({ params, searchParams }: RoomPageProps): Promise<Metadata> {
  const { slug } = await params;
  const preview = await isPreviewMode(await searchParams);
  const room = await getRoomBySlug(slug, { includeDrafts: preview });
  const hotel = await getHotel();
  if (!room) return { title: "Kamar tidak ditemukan" };

  const ogImage = room.photos[0]?.url;
  // Nama hotel ditambahkan oleh template di root layout (%s | Nama Hotel) —
  // cukup set nama kamar saja agar tidak duplikat.
  return {
    title: room.name,
    description: room.description?.slice(0, 160),
    alternates: { canonical: `${siteUrl}/rooms/${room.slug}` },
    openGraph: {
      title: `${room.name} — ${hotel?.name ?? "Hotel"}`,
      description: room.description?.slice(0, 160),
      images: ogImage ? [ogImage] : [],
    },
  };
}

export default async function RoomPage({ params, searchParams }: RoomPageProps) {
  const { slug } = await params;
  const preview = await isPreviewMode(await searchParams);

  const [room, hotel, reviews] = await Promise.all([
    getRoomBySlug(slug, { includeDrafts: preview }),
    getHotel(),
    db.review.findMany().catch(() => []),
  ]);

  if (!room) notFound();

  const currency = room.currency || hotel?.currency || "IDR";
  const mainPhoto = room.photos[0];
  // Maks 2 foto tambahan agar grid tetap rapi (2 kolom).
  const extraPhotos = room.photos.slice(1, 3);
  const whatsappUrl = hotel?.whatsapp
    ? `https://wa.me/${hotel.whatsapp}?text=${encodeURIComponent(
        `Halo, saya ingin bertanya tentang kamar ${room.name}.`,
      )}`
    : null;

  return (
    <>
      {preview ? <PreviewBanner backHref={`/rooms/${slug}`} /> : null}
      <Header hotelName={hotel?.name ?? "Hotel"} />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <Link
          href="/#rooms"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-ink"
        >
          <ArrowLeft size={16} aria-hidden /> Semua Kamar
        </Link>

        {/* Gallery */}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {mainPhoto ? (
            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl sm:col-span-2">
              <Image
                src={mainPhoto.url}
                alt={mainPhoto.altText || room.name}
                fill
                priority
                sizes="(min-width: 640px) 100vw, 100vw"
                className="object-cover"
              />
            </div>
          ) : (
            <div
              aria-hidden
              className="aspect-[16/10] rounded-2xl bg-gradient-to-br from-primary-100 to-primary-300 sm:col-span-2"
            />
          )}
          {extraPhotos.map((photo) => (
            <div key={photo.id} className="relative aspect-[4/3] overflow-hidden rounded-xl">
              <Image
                src={photo.url}
                alt={photo.altText || room.name}
                fill
                sizes="(min-width: 640px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_340px]">
          {/* Konten utama */}
          <div>
            <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">
              {room.name}
            </h1>

            <ul className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
              {room.sizeM2 != null && (
                <li className="flex items-center gap-1.5">
                  <Ruler size={16} aria-hidden /> {room.sizeM2} m²
                </li>
              )}
              {room.maxOccupancy != null && (
                <li className="flex items-center gap-1.5">
                  <Users size={16} aria-hidden /> {room.maxOccupancy} Guests
                </li>
              )}
              {room.bedType && (
                <li className="flex items-center gap-1.5">
                  <BedDouble size={16} aria-hidden /> {room.bedType}
                </li>
              )}
              {room.view && (
                <li className="flex items-center gap-1.5">
                  <Maximize2 size={16} aria-hidden /> {room.view}
                </li>
              )}
            </ul>

            {room.description && (
              <p className="mt-6 leading-relaxed text-ink-soft">{room.description}</p>
            )}

            {room.amenities.length > 0 && (
              <>
                <h2 className="mt-10 font-display text-xl font-semibold text-ink">Fasilitas Kamar</h2>
                <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
                  {room.amenities.map((amenity) => (
                    <li key={amenity.id} className="flex items-center gap-2 text-sm text-ink-soft">
                      <Check size={16} aria-hidden className="shrink-0 text-primary-700" />
                      {amenity.name}
                    </li>
                  ))}
                </ul>
              </>
            )}

            {/* Kebijakan */}
            <div className="mt-10 rounded-2xl border border-border bg-surface-muted p-6">
              <h2 className="font-display text-xl font-semibold text-ink">Informasi Menginap</h2>
              <ul className="mt-4 space-y-3 text-sm text-ink-soft">
                <li className="flex items-center gap-2">
                  <Clock3 size={16} aria-hidden className="text-primary-700" />
                  Check-in {hotel?.checkInTime ?? "14:00"} · Check-out {hotel?.checkOutTime ?? "12:00"}
                </li>
                <li className="flex items-center gap-2">
                  <Users size={16} aria-hidden className="text-primary-700" />
                  Maksimal {room.maxOccupancy ?? "-"} tamu per kamar
                </li>
                <li className="flex items-center gap-2">
                  <Coffee size={16} aria-hidden className="text-primary-700" />
                  {room.breakfastIncluded ? "Sarapan termasuk" : "Sarapan tidak termasuk"}
                </li>
              </ul>
            </div>
          </div>

          {/* Sidebar CTA */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
              {room.priceFrom != null && (
                <p className="text-sm text-muted">
                  From{" "}
                  <span className="text-2xl font-semibold text-ink">
                    {formatCurrency(Number(room.priceFrom), currency)}
                  </span>
                  <span className="text-sm text-muted">/malam</span>
                </p>
              )}
              <Link
                href={buildAvailabilityUrl({ room: room.slug })}
                className="mt-5 flex h-12 w-full items-center justify-center rounded-lg bg-primary-700 text-sm font-semibold text-white transition-colors hover:bg-primary-800"
              >
                Check Availability
              </Link>
              {whatsappUrl && (
                <TrackedLink
                  event={EVENTS.clickWhatsapp}
                  params={{ room: room.name }}
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-border text-sm font-medium text-ink transition-colors hover:bg-surface-muted"
                >
                  <MessageCircle size={17} aria-hidden /> Tanya via WhatsApp
                </TrackedLink>
              )}
              <p className="mt-4 text-center text-xs leading-relaxed text-muted">
                Harga terbaik saat booking langsung. Pembayaran diproses aman oleh sistem booking kami.
              </p>
            </div>
          </aside>
        </div>
      </main>

      {/* SEO-004: HotelRoom + Offer + AggregateRating (rating hanya jika ada data nyata). */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript(roomJsonLd(room, hotel?.name ?? "Hotel", reviews)),
        }}
      />
    </>
  );
}
