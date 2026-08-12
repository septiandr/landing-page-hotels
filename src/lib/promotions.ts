import { db } from "@/lib/db";
import type { PromotionStatus } from "@/generated/prisma/client";

/**
 * Logika status promotion berbasis waktu (PRD §18, DoD DATA-003).
 *
 * Status yang disimpan di DB tidak pernah dianggap final — status "efektif"
 * dihitung dari bookingStart/bookingEnd vs waktu sekarang:
 *   - DRAFT / EXPIRED (tersimpan) → tetap (tidak tampil)
 *   - bookingEnd lewat           → EXPIRED (auto-expire)
 *   - bookingStart belum lewat   → SCHEDULED (belum tampil)
 *   - selain itu                 → ACTIVE
 */

export interface PromotionTimeInfo {
  status: PromotionStatus;
  bookingStart: Date | null;
  bookingEnd: Date | null;
}

export function getPromotionStatus(
  promo: PromotionTimeInfo,
  now: Date = new Date(),
): PromotionStatus {
  if (promo.status === "DRAFT" || promo.status === "EXPIRED") return promo.status;
  if (promo.bookingEnd && now > promo.bookingEnd) return "EXPIRED";
  if (promo.bookingStart && now < promo.bookingStart) return "SCHEDULED";
  return "ACTIVE";
}

export function isPromotionVisible(promo: PromotionTimeInfo, now: Date = new Date()): boolean {
  return getPromotionStatus(promo, now) === "ACTIVE";
}

/**
 * Query promotion untuk landing page — logika waktu diterapkan di sini.
 * Saat `opts.preview` true (preview mode CMS-U-012) semua status ikut
 * ditampilkan supaya draft/expired pun bisa direview.
 */
export async function getActivePromotions(
  now: Date = new Date(),
  opts: { preview?: boolean } = {},
) {
  const promos = await db.promotion.findMany({
    where: opts.preview ? {} : { status: { in: ["ACTIVE", "SCHEDULED"] } },
    orderBy: { sortOrder: "asc" },
  });
  if (opts.preview) return promos;
  return promos.filter((promo) => isPromotionVisible(promo, now));
}
