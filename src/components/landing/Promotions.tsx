"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { TicketPercent } from "lucide-react";
import type { Promotion } from "@/generated/prisma/client";
import { PromotionCountdown } from "./PromotionCountdown";
import { CopyCodeButton } from "./CopyCodeButton";

/**
 * LP-010 — Promotions.
 * Menampilkan promotion ACTIVE (kalkulasi waktu via lib/promotions, DATA-003),
 * sort by sortOrder. CTA "BOOK NOW" membawa promo code pre-filled ke widget
 * via query param `?code=…#booking` (dibaca BookingWidget, BK-011).
 * Saat countdown habis → card otomatis hilang (DoD LP-010).
 */
export function Promotions({ promotions }: { promotions: Promotion[] }) {
  const [expiredIds, setExpiredIds] = useState<string[]>([]);
  const visible = promotions.filter((p) => !expiredIds.includes(p.id));

  if (visible.length === 0) return null;

  return (
    <section id="offers" className="bg-surface py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-primary-700">
          Offers
        </p>
        <h2 className="mt-3 text-center font-display text-3xl font-semibold text-ink sm:text-4xl">
          Special Offers &amp; Packages
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-base text-muted">
          Harga terbaik hanya saat booking langsung — plus benefit eksklusif.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {visible.map((promo) => (
            <article
              key={promo.id}
              className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-white transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary-900/5 sm:flex-row"
            >
              {promo.image && (
                <div className="relative aspect-[16/10] shrink-0 sm:aspect-auto sm:w-2/5">
                  <Image
                    src={promo.image}
                    alt={promo.title}
                    fill
                    sizes="(min-width: 640px) 40vw, 100vw"
                    className="object-cover"
                  />
                </div>
              )}
              <div className="flex flex-1 flex-col p-6">
                <div className="flex flex-wrap items-center gap-2">
                  {promo.discountLabel && (
                    <span className="rounded-full bg-accent-500 px-2.5 py-0.5 text-xs font-bold text-primary-950">
                      {promo.discountLabel}
                    </span>
                  )}
                  {promo.showCountdown && promo.bookingEnd && (
                    <PromotionCountdown
                      endsAt={promo.bookingEnd.toISOString()}
                      onExpired={() =>
                        setExpiredIds((ids) => [...ids, promo.id])
                      }
                    />
                  )}
                </div>

                <h3 className="mt-3 font-display text-xl font-semibold text-ink">
                  {promo.title}
                </h3>
                {promo.description && (
                  <p className="mt-2 text-sm leading-relaxed text-muted">{promo.description}</p>
                )}

                {promo.promoCode && (
                  <div className="mt-4 flex items-center gap-2">
                    <span className="flex items-center gap-1.5 rounded-lg border border-dashed border-primary-300 bg-primary-50 px-3 py-1.5 font-mono text-sm font-semibold text-primary-800">
                      <TicketPercent size={14} aria-hidden />
                      {promo.promoCode}
                    </span>
                    <CopyCodeButton code={promo.promoCode} />
                  </div>
                )}

                {promo.terms && (
                  <details className="group/terms mt-3 text-sm text-muted">
                    <summary className="cursor-pointer list-none text-xs font-medium text-primary-700 transition hover:text-primary-800">
                      Terms &amp; conditions
                    </summary>
                    <p className="mt-2 rounded-lg bg-surface-muted p-3 text-xs leading-relaxed text-ink-soft">
                      {promo.terms}
                    </p>
                  </details>
                )}

                <div className="mt-auto pt-5">
                  <Link
                    href={`/?code=${encodeURIComponent(promo.promoCode ?? "")}#booking`}
                    className="inline-flex h-10 items-center justify-center rounded-lg bg-primary-700 px-5 text-sm font-semibold text-white transition hover:bg-primary-800"
                  >
                    {promo.ctaLabel || "Book Now"}
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
