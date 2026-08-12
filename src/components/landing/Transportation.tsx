import { Car, MapPin, MessageCircle, Plane, Train } from "lucide-react";

/**
 * LP-014 — Transportation (PRD §25).
 *
 * Catatan: doc/02 data model belum punya entitas "Transport" (text blocks CMS).
 * Section ini di-render HANYA jika ada kontak hotel yang valid, dan mengarahkan
 * guest ke konfirmasi airport transfer via WhatsApp + tombol Directions.
 * Opsi transportasi penuh (taxi, ride-hailing, train, car rental) menyusul
 * ketika model CMS tersedia — sesuai prinsip "render hanya jika ada konten".
 */
export function Transportation({
  address,
  whatsapp,
}: {
  address?: string | null;
  whatsapp?: string | null;
}) {
  if (!whatsapp && !address) return null;

  const waNumber = whatsapp?.replace(/^\+/, "");

  return (
    <section id="transportation" className="bg-surface py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-border bg-white p-6">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
              <Plane className="h-5 w-5" aria-hidden />
            </span>
            <h3 className="mt-4 font-display text-lg font-semibold text-ink">
              Airport Transfer
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Kami bantu jemput dari Bandara Yogyakarta (YIA) dengan tarif
              transparan — konfirmasi dulu via WhatsApp.
            </p>
            {waNumber && (
              <a
                href={`https://wa.me/${waNumber}?text=${encodeURIComponent("Halo, saya ingin memesan airport transfer dari Bandara YIA. Mohon info tarif & ketersediaan.")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-primary-700 px-4 text-sm font-medium text-white transition hover:bg-primary-800"
              >
                <MessageCircle className="h-4 w-4" aria-hidden /> Book Airport Transfer
              </a>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-white p-6">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
              <Car className="h-5 w-5" aria-hidden />
            </span>
            <h3 className="mt-4 font-display text-lg font-semibold text-ink">
              Taxi &amp; Ride-hailing
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Stasiun Tugu dan Malioboro dapat dicapai dengan mudah — tanya
              resepsionis untuk rekomendasi & tarif terbaik.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-white p-6">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
              <Train className="h-5 w-5" aria-hidden />
            </span>
            <h3 className="mt-4 font-display text-lg font-semibold text-ink">
              Train &amp; Getting Here
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              {address ? (
                <span className="flex items-start gap-1.5">
                  <MapPin size={15} aria-hidden className="mt-0.5 shrink-0 text-primary-700" />
                  {address}
                </span>
              ) : (
                "Hubungi kami untuk panduan arah menuju hotel."
              )}
            </p>
            {address && (
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex h-10 items-center justify-center rounded-lg border border-border text-sm font-medium text-ink transition hover:bg-surface-muted"
              >
                Open in Google Maps
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
