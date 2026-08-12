import Image from "next/image";
import { Clock3, Navigation } from "lucide-react";
import type { Attraction } from "@/generated/prisma/client";

/**
 * LP-014 — Nearby Attractions (PRD §25).
 * Data dari CMS: nama, deskripsi, travel time (menit), jarak (km).
 */
export function Attractions({ attractions }: { attractions: Attraction[] }) {
  if (attractions.length === 0) return null;

  return (
    <section id="attractions" className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-primary-700">
          Around Us
        </p>
        <h2 className="mt-3 text-center font-display text-3xl font-semibold text-ink sm:text-4xl">
          Nearby Attractions
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-base text-muted">
          Semua keindahan Yogyakarta ada di sekitar hotel.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {attractions.map((attraction) => (
            <article
              key={attraction.id}
              className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary-900/5"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                {attraction.image ? (
                  <Image
                    src={attraction.image}
                    alt={attraction.name}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div aria-hidden className="absolute inset-0 bg-surface-muted" />
                )}
              </div>
              <div className="flex flex-1 flex-col p-4">
                <h3 className="font-display text-base font-semibold text-ink">
                  {attraction.name}
                </h3>
                {attraction.description && (
                  <p className="mt-1.5 line-clamp-2 text-sm text-muted">
                    {attraction.description}
                  </p>
                )}
                {(attraction.travelTimeMin != null || attraction.distanceKm != null) && (
                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                    {attraction.travelTimeMin != null && (
                      <span className="flex items-center gap-1.5">
                        <Clock3 size={14} aria-hidden className="text-primary-700" />
                        {attraction.travelTimeMin} min
                      </span>
                    )}
                    {attraction.distanceKm != null && (
                      <span className="flex items-center gap-1.5">
                        <Navigation size={14} aria-hidden className="text-primary-700" />
                        {attraction.distanceKm} km
                      </span>
                    )}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
