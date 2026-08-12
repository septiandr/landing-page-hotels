import Image from "next/image";
import { Clock3, MessageCircle, Tag } from "lucide-react";
import type { Experience } from "@/generated/prisma/client";
import { EVENTS } from "@/lib/analytics";
import { TrackedLink } from "@/components/analytics/TrackedLink";
import { formatCurrency } from "@/lib/format";

/**
 * LP-009 — Experiences.
 * CTA WhatsApp: wa.me dengan pesan pre-filled berisi nama experience (PRD §24).
 * Jika experience punya ctaUrl (mis. link engine), itu didahulukan.
 */
export function Experiences({
  experiences,
  whatsapp,
  hotelCurrency = "IDR",
}: {
  experiences: Experience[];
  whatsapp?: string | null;
  hotelCurrency?: string;
}) {
  if (experiences.length === 0) return null;

  const waNumber = whatsapp?.replace(/^\+/, "");

  return (
    <section id="experiences" className="bg-surface py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-primary-700">
          Experiences
        </p>
        <h2 className="mt-3 text-center font-display text-3xl font-semibold text-ink sm:text-4xl">
          Beyond a Stay
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-base text-muted">
          Jelajahi Yogyakarta bersama kami — dari heritage walk hingga wisata kuliner.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {experiences.map((exp) => {
            const href =
              exp.ctaUrl ??
              (waNumber
                ? `https://wa.me/${waNumber}?text=${encodeURIComponent(
                    `Halo, saya tertarik dengan "${exp.title}"${exp.duration ? ` (${exp.duration})` : ""}. Bisa info lebih lanjut?`,
                  )}`
                : undefined);

            return (
              <article
                key={exp.id}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-white transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary-900/5"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  {exp.image ? (
                    <Image
                      src={exp.image}
                      alt={exp.title}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div aria-hidden className="absolute inset-0 bg-surface-muted" />
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="font-display text-lg font-semibold text-ink">{exp.title}</h3>
                  {exp.description && (
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">
                      {exp.description}
                    </p>
                  )}
                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted">
                    {exp.duration && (
                      <span className="flex items-center gap-1.5">
                        <Clock3 size={15} aria-hidden /> {exp.duration}
                      </span>
                    )}
                    {exp.priceFrom != null && (
                      <span className="flex items-center gap-1.5">
                        <Tag size={15} aria-hidden />
                        From {formatCurrency(Number(exp.priceFrom), hotelCurrency)}
                      </span>
                    )}
                  </div>
                  {href && (
                    <TrackedLink
                      event={EVENTS.clickWhatsapp}
                      params={{ content: exp.title }}
                      href={href}
                      target={href.startsWith("http") ? "_blank" : undefined}
                      rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                      className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary-700 text-sm font-medium text-white transition hover:bg-primary-800"
                    >
                      <MessageCircle className="h-4 w-4" aria-hidden />
                      {exp.ctaLabel || "Book via WhatsApp"}
                    </TrackedLink>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
