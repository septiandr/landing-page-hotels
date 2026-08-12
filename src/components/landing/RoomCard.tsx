import Image from "next/image";
import Link from "next/link";
import { BedDouble, Check, Maximize2, Ruler, Users } from "lucide-react";
import type { Room, RoomAmenity, RoomPhoto } from "@/generated/prisma/client";
import { EVENTS } from "@/lib/analytics";
import { TrackedLink } from "@/components/analytics/TrackedLink";
import { formatCurrency } from "@/lib/format";
import { buildAvailabilityUrl } from "@/lib/booking/url";

export type RoomWithRelations = Room & {
  photos: RoomPhoto[];
  amenities: RoomAmenity[];
};

const MAX_AMENITY_CHIPS = 3;

export function RoomCard({ room }: { room: RoomWithRelations }) {
  const photo = room.photos[0];
  const extraAmenities = Math.max(0, room.amenities.length - MAX_AMENITY_CHIPS);
  const currency = room.currency || "IDR";

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary-900/5">
      {/* Foto */}
      {/* Foto: link duplikat dari judul — disembunyikan dari screen reader & tab order. */}
      <Link
        href={`/rooms/${room.slug}`}
        tabIndex={-1}
        aria-hidden
        className="relative block aspect-[4/3] overflow-hidden"
      >
        {photo ? (
          <Image
            src={photo.url}
            alt={photo.altText || room.name}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div aria-hidden className="absolute inset-0 bg-surface-muted" />
        )}
        {room.breakfastIncluded && (
          <span className="absolute left-3 top-3 rounded-full bg-accent-500/95 px-2.5 py-0.5 text-xs font-semibold text-primary-950">
            Breakfast Included
          </span>
        )}
      </Link>

      {/* Konten */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-xl font-semibold leading-snug text-ink">
          <TrackedLink
            internal
            event={EVENTS.viewRoom}
            params={{ room: room.slug }}
            href={`/rooms/${room.slug}`}
            className="transition-colors hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded"
          >
            {room.name}
          </TrackedLink>
        </h3>

        <ul className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted">
          {room.sizeM2 != null && (
            <li className="flex items-center gap-1.5">
              <Ruler size={15} aria-hidden /> {room.sizeM2} m²
            </li>
          )}
          {room.maxOccupancy != null && (
            <li className="flex items-center gap-1.5">
              <Users size={15} aria-hidden /> {room.maxOccupancy} Guests
            </li>
          )}
          {room.bedType && (
            <li className="flex items-center gap-1.5">
              <BedDouble size={15} aria-hidden /> {room.bedType}
            </li>
          )}
          {room.view && (
            <li className="flex items-center gap-1.5">
              <Maximize2 size={15} aria-hidden /> {room.view}
            </li>
          )}
        </ul>

        {/* Amenities */}
        {room.amenities.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {room.amenities.slice(0, MAX_AMENITY_CHIPS).map((amenity) => (
              <li
                key={amenity.id}
                className="flex items-center gap-1 rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium text-ink-soft"
              >
                <Check size={13} aria-hidden className="text-primary-700" />
                {amenity.name}
              </li>
            ))}
            {extraAmenities > 0 && (
              <li className="rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium text-muted">
                +{extraAmenities} lainnya
              </li>
            )}
          </ul>
        )}

        {/* Harga + CTA */}
        <div className="mt-auto pt-5">
          {room.priceFrom != null && (
            <p className="text-sm text-muted">
              From{" "}
              <span className="text-lg font-semibold text-ink">
                {formatCurrency(Number(room.priceFrom), currency)}
              </span>
              /malam
            </p>
          )}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <TrackedLink
              internal
              event={EVENTS.viewRoom}
              params={{ room: room.slug }}
              href={`/rooms/${room.slug}`}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-border text-sm font-medium text-ink transition-colors hover:bg-surface-muted"
            >
              View Room
            </TrackedLink>
            <Link
              href={buildAvailabilityUrl({ room: room.slug })}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-primary-700 text-sm font-medium text-white transition-colors hover:bg-primary-800"
            >
              Check Availability
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
