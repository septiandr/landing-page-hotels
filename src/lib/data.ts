import { cache } from "react";
import { db } from "@/lib/db";

/**
 * Data helpers dengan React `cache()` — meng-dedupe query Prisma dalam satu
 * render pass (mis. antara `generateMetadata` dan page component).
 */

export const getHotel = cache(async () => db.hotel.findFirst());

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
