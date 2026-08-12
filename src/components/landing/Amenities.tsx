import type { Amenity } from "@/generated/prisma/client";
import { getIcon } from "./icon-map";

const GROUP_META = {
  HOTEL: { label: "Hotel Facilities", sub: "Fasilitas di seluruh area hotel", icon: "Hotel" },
  ROOM: { label: "Room Facilities", sub: "Fasilitas di dalam kamar", icon: "BedDouble" },
} as const;

export function Amenities({ amenities }: { amenities: Amenity[] }) {
  if (amenities.length === 0) return null;

  const groups = (["HOTEL", "ROOM"] as const)
    .map((key) => ({
      key,
      meta: GROUP_META[key],
      items: amenities.filter((a) => a.group === key),
    }))
    .filter((group) => group.items.length > 0);

  if (groups.length === 0) return null;

  return (
    <section id="amenities" className="bg-surface py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-primary-700">
          Amenities
        </p>
        <h2 className="mt-3 text-center font-display text-3xl font-semibold text-ink sm:text-4xl">
          Everything You Need
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-base text-muted">
          Kenyamananmu adalah prioritas kami — dari fasilitas hotel hingga detail di dalam kamar.
        </p>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {groups.map(({ key, meta, items }) => {
            const GroupIcon = getIcon(meta.icon);
            return (
              <div key={key} className="rounded-2xl border border-border bg-surface-muted p-6 sm:p-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-700 text-white">
                    <GroupIcon size={22} aria-hidden />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-semibold text-ink">{meta.label}</h3>
                    <p className="text-sm text-muted">{meta.sub}</p>
                  </div>
                </div>

                <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
                  {items.map((amenity) => {
                    const Icon = getIcon(amenity.icon);
                    return (
                      <li
                        key={amenity.id}
                        className="flex items-start gap-3 rounded-xl bg-surface p-3"
                      >
                        <Icon
                          size={18}
                          aria-hidden
                          className="mt-0.5 shrink-0 text-primary-700"
                        />
                        <div>
                          <p className="text-sm font-medium text-ink">{amenity.name}</p>
                          {amenity.description && (
                            <p className="mt-0.5 text-xs leading-relaxed text-muted">
                              {amenity.description}
                            </p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
