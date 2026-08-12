"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink, MapPin, Navigation } from "lucide-react";

const FALLBACK_TIMEOUT_MS = 5000;

/**
 * LP-013 — Location (PRD §23).
 * Google Maps embed iframe (tanpa API key, `loading="lazy"`).
 * Fallback (PRD §32): jika iframe tidak load dalam timeout → tampilkan alamat
 * lengkap + link "Open in Google Maps" — halaman tetap usable saat offline.
 */
export function Location({
  lat,
  lng,
  address,
  hotelName,
}: {
  lat?: number | null;
  lng?: number | null;
  address?: string | null;
  hotelName?: string;
}) {
  const hasCoords = typeof lat === "number" && typeof lng === "number";
  // Tanpa koordinat → langsung fallback (state awal, bukan setState dalam effect).
  const [failed, setFailed] = useState(() => !hasCoords);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!hasCoords) return;
    const t = window.setTimeout(() => {
      if (!loadedRef.current) setFailed(true);
    }, FALLBACK_TIMEOUT_MS);
    return () => window.clearTimeout(t);
  }, [hasCoords]);

  const mapUrl = hasCoords
    ? `https://www.google.com/maps?q=${lat},${lng}&z=15&output=embed`
    : null;
  const directionsUrl = hasCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
    : null;

  return (
    <section id="location" className="bg-surface py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-primary-700">
          Location
        </p>
        <h2 className="mt-3 text-center font-display text-3xl font-semibold text-ink sm:text-4xl">
          Find Us
        </h2>

        <div className="mt-12 overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
          {mapUrl && !failed ? (
            <iframe
              src={mapUrl}
              title={`Peta lokasi ${hotelName ?? "hotel"}`}
              className="h-[360px] w-full sm:h-[420px]"
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              onLoad={() => {
                loadedRef.current = true;
              }}
            />
          ) : (
            <div className="flex h-[360px] flex-col items-center justify-center gap-4 bg-surface-muted p-8 text-center sm:h-[420px]">
              <MapPin className="h-10 w-10 text-primary-300" aria-hidden />
              {address ? (
                <>
                  <p className="max-w-md font-display text-lg font-semibold text-ink">
                    {hotelName ? `${hotelName} — ` : ""}
                    {address}
                  </p>
                  {directionsUrl && (
                    <a
                      href={directionsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary-700 px-5 text-sm font-medium text-white transition hover:bg-primary-800"
                    >
                      <Navigation className="h-4 w-4" aria-hidden /> Open in Google Maps
                    </a>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted">Alamat hotel belum diisi.</p>
              )}
            </div>
          )}
        </div>

        {address && (
          <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-sm text-muted">
            <ExternalLink size={14} aria-hidden className="text-primary-700" />
            {address}
          </p>
        )}
      </div>
    </section>
  );
}
