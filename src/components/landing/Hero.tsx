import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/format";

export interface HeroProps {
  hotelName: string;
  tagline: string;
  heroImage: string | null;
  cheapestPrice: { price: number; currency: string } | null;
}

export function Hero({ hotelName, tagline, heroImage, cheapestPrice }: HeroProps) {
  return (
    <section id="top" className="relative flex min-h-[85svh] items-center justify-center overflow-hidden">
      {heroImage ? (
        <Image
          src={heroImage}
          alt={`${hotelName} — gambar utama`}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      ) : (
        <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-primary-800 via-primary-900 to-ink" />
      )}
      {/* Overlay untuk kontras teks */}
      <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/70" />

      <div className="relative z-10 mx-auto max-w-3xl px-6 py-28 text-center text-white">
        <Badge className="border border-white/20 bg-white/10 text-white backdrop-blur-sm">
          Book Direct &amp; Get More
        </Badge>

        <h1 className="mt-6 font-display text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
          {hotelName}
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
          {tagline}
        </p>

        {cheapestPrice && (
          <p className="mt-4 text-sm text-white/75">
            Kamar mulai dari{" "}
            <span className="font-semibold text-white">
              {formatCurrency(cheapestPrice.price, cheapestPrice.currency)}
            </span>
            /malam
          </p>
        )}

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <a
            href="#booking"
            className="inline-flex h-12 items-center justify-center rounded-lg bg-accent-500 px-7 text-base font-semibold text-primary-950 transition-colors hover:bg-accent-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
          >
            Check Availability
          </a>
          <a
            href="#rooms"
            className="inline-flex h-12 items-center justify-center rounded-lg border border-white/40 px-7 text-base font-medium text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
          >
            Explore Rooms
          </a>
        </div>
      </div>
    </section>
  );
}
