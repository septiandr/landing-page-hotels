import { MapPin } from "lucide-react";
import type { TransportOption } from "@/generated/prisma/client";
import { getIcon } from "./icon-map";
import { formatCurrency } from "@/lib/format";

/**
 * LP-014 — Transportation (PRD §25).
 * Opsi transportasi kini 100% dari CMS (model TransportOption): ikon, judul,
 * deskripsi, harga mulai, dan CTA (mis. wa.me). Plus card "Getting Here"
 * dengan alamat & link Google Maps dari data hotel.
 * Section tidak dirender jika tidak ada konten.
 */
export function Transportation({
  transports,
  address,
  hotelCurrency = "IDR",
}: {
  transports: TransportOption[];
  address?: string | null;
  hotelCurrency?: string;
}) {
  if (transports.length === 0 && !address) return null;

  return (
    <section id="transportation" className="bg-surface py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {transports.map((option) => {
            const Icon = getIcon(option.icon);
            return (
              <div
                key={option.id}
                className="flex flex-col rounded-2xl border border-border bg-white p-6"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold text-ink">
                  {option.title}
                </h3>
                {option.description && (
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {option.description}
                  </p>
                )}
                <div className="mt-auto pt-4">
                  {option.priceFrom != null && (
                    <p className="text-sm text-muted">
                      From{" "}
                      <span className="text-lg font-semibold text-ink">
                        {formatCurrency(Number(option.priceFrom), hotelCurrency)}
                      </span>
                    </p>
                  )}
                  {option.ctaUrl && (
                    <a
                      href={option.ctaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex h-10 items-center justify-center rounded-lg bg-primary-700 px-4 text-sm font-medium text-white transition hover:bg-primary-800"
                    >
                      {option.ctaLabel || "Book Now"}
                    </a>
                  )}
                </div>
              </div>
            );
          })}

          {address && (
            <div className="flex flex-col rounded-2xl border border-border bg-white p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
                <MapPin className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-4 font-display text-lg font-semibold text-ink">
                Getting Here
              </h3>
              <p className="mt-2 flex items-start gap-1.5 text-sm leading-relaxed text-muted">
                <MapPin size={15} aria-hidden className="mt-0.5 shrink-0 text-primary-700" />
                {address}
              </p>
              <div className="mt-auto pt-4">
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center justify-center rounded-lg border border-border text-sm font-medium text-ink transition hover:bg-surface-muted"
                >
                  Open in Google Maps
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
