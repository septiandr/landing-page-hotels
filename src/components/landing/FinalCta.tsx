"use client";

import { CalendarCheck2 } from "lucide-react";
import { EVENTS, track } from "@/lib/analytics";

/**
 * LP-016 — Final CTA (PRD §27).
 * "Ready for Your Next Stay?" → scroll halus ke booking widget, track
 * `click_book_now` (ANA-003).
 */
export function FinalCta({ backgroundImage }: { backgroundImage?: string | null }) {
  function onBookNow() {
    track(EVENTS.clickBookNow, { location: "final_cta" });
    document.querySelector("#booking")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <section
      className="relative overflow-hidden bg-primary-950 py-24 sm:py-32"
      aria-labelledby="final-cta-title"
    >
      {backgroundImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={backgroundImage}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover opacity-20"
        />
      )}
      <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2
          id="final-cta-title"
          className="font-display text-3xl font-semibold text-white sm:text-4xl"
        >
          Ready for Your Next Stay?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-primary-100/80">
          Book langsung untuk mendapatkan Best Available Rate, free breakfast, dan
          benefit eksklusif lainnya.
        </p>
        <button
          type="button"
          onClick={onBookNow}
          className="mt-8 inline-flex h-12 items-center gap-2 rounded-lg bg-accent-500 px-8 text-sm font-bold text-primary-950 shadow-lg transition hover:bg-accent-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-300 focus-visible:ring-offset-2 focus-visible:ring-offset-primary-950"
        >
          <CalendarCheck2 className="h-5 w-5" aria-hidden />
          Check Availability
        </button>
      </div>
    </section>
  );
}
