import { cache } from "react";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";

/**
 * Data helpers dengan React `cache()` — meng-dedupe query Prisma dalam satu
 * render pass (mis. antara `generateMetadata` dan page component).
 */

// include seo supaya metadata (SEO-001) dan JSON-LD bisa dibaca sekali query.
// unstable_cache (tag "hotel", TTL 60s) supaya generateMetadata root layout
// tidak query DB berlebih — termasuk saat render halaman /admin/*. Semua
// mutation hotel via CMS sudah revalidateTag("hotel") (lihat revalidate.ts).
export const getHotel = cache(() =>
  unstable_cache(
    async () => db.hotel.findFirst({ include: { seo: true } }),
    ["hotel-data"],
    { tags: ["hotel"], revalidate: 60 },
  )(),
);

export const getRoomBySlug = cache(
  async (slug: string, opts: { includeDrafts?: boolean } = {}) =>
    db.room.findUnique({
      // Hanya room PUBLISHED yang tampil publik — draft hanya lewat preview mode.
      where: opts.includeDrafts ? { slug } : { slug, status: "PUBLISHED" },
      include: {
        photos: { orderBy: { sortOrder: "asc" } },
        amenities: true,
      },
    }),
);
