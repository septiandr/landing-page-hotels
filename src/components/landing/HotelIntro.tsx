import Link from "next/link";
import { ArrowRight, BedDouble, Clock3, MapPin, Sparkles } from "lucide-react";

export interface HighlightStat {
  icon: "rooms" | "checkin" | "nearby" | "amenities";
  value: string;
  label: string;
}

/**
 * LP-005 — Hotel Intro + Highlights.
 * Stat di-drive dari data nyata (PRD §12): jumlah kamar published dari DB,
 * jam check-in dari CMS, jarak ke atraksi terdekat, jumlah fasilitas.
 */
export function HotelIntro({
  hotelName,
  story,
  stats,
}: {
  hotelName: string;
  story?: string | null;
  stats: HighlightStat[];
}) {
  if (!story && stats.length === 0) return null;

  return (
    <section id="intro" className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-700">
              Our Story
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold leading-tight text-ink sm:text-4xl">
              Welcome to {hotelName}
            </h2>
            {story && (
              <p className="mt-5 text-base leading-relaxed text-muted">{story}</p>
            )}
            <Link
              href="#rooms"
              className="mt-8 inline-flex h-11 items-center gap-2 rounded-lg bg-primary-700 px-6 text-sm font-semibold text-white transition hover:bg-primary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
            >
              Discover Our Hotel
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>

          <dl className="grid grid-cols-2 gap-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-border bg-surface p-5"
              >
                <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted">
                  <StatIcon name={stat.icon} /> {stat.label}
                </dt>
                <dd className="mt-2 font-display text-2xl font-semibold text-ink sm:text-3xl">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

function StatIcon({ name }: { name: HighlightStat["icon"] }) {
  const className = "h-4 w-4 text-primary-700";
  switch (name) {
    case "rooms":
      return <BedDouble className={className} aria-hidden />;
    case "checkin":
      return <Clock3 className={className} aria-hidden />;
    case "nearby":
      return <MapPin className={className} aria-hidden />;
    case "amenities":
      return <Sparkles className={className} aria-hidden />;
  }
}
