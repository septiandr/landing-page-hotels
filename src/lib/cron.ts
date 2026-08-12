import { db } from "./db";
import { audit } from "./audit";
import { revalidateContent } from "./revalidate";

/** Bentuk minimal model konten yang diproses cron. */
interface ContentModel {
  findMany(args: Record<string, unknown>): Promise<{ id: string; status: string }[]>;
  update(args: Record<string, unknown>): Promise<unknown>;
}

const CONTENT_MODELS: { model: ContentModel; entity: string }[] = [
  { model: db.room as unknown as ContentModel, entity: "Room" },
  { model: db.galleryItem as unknown as ContentModel, entity: "GalleryItem" },
  { model: db.testimonial as unknown as ContentModel, entity: "Testimonial" },
  { model: db.experience as unknown as ContentModel, entity: "Experience" },
];

/**
 * Proses jadwal publish (dijalankan Vercel Cron — lihat vercel.json).
 * 1. Promotion SCHEDULED dengan scheduledPublishAt <= now → ACTIVE.
 * 2. Promotion ACTIVE yang melewati bookingEnd → EXPIRED.
 * 3. Konten (Room/Gallery/Testimonial/Experience) dengan
 *    scheduledPublishAt <= now → PUBLISHED.
 */
export async function processScheduledPublishes(): Promise<{
  published: number;
  expired: number;
}> {
  const now = new Date();
  let published = 0;
  let expired = 0;

  // --- Promotion: schedule → active ---
  const duePromotions = await db.promotion.findMany({
    where: { status: "SCHEDULED", scheduledPublishAt: { lte: now } },
  });
  for (const promo of duePromotions) {
    await db.promotion.update({ where: { id: promo.id }, data: { status: "ACTIVE" } });
    await audit({
      action: "PUBLISH",
      entity: "Promotion",
      entityId: promo.id,
      previous: { status: "SCHEDULED" },
      next: { status: "ACTIVE" },
    });
    published += 1;
  }

  // --- Promotion: lewat bookingEnd → expired ---
  const expiring = await db.promotion.findMany({
    where: { status: "ACTIVE", bookingEnd: { lt: now } },
  });
  for (const promo of expiring) {
    await db.promotion.update({ where: { id: promo.id }, data: { status: "EXPIRED" } });
    await audit({
      action: "UPDATE",
      entity: "Promotion",
      entityId: promo.id,
      previous: { status: "ACTIVE" },
      next: { status: "EXPIRED" },
    });
    expired += 1;
  }

  // --- Konten: schedule → published ---
  for (const { model, entity } of CONTENT_MODELS) {
    const due = await model.findMany({
      where: { status: "DRAFT", scheduledPublishAt: { lte: now } },
    });
    for (const item of due) {
      await model.update({ where: { id: item.id }, data: { status: "PUBLISHED" } });
      await audit({
        action: "PUBLISH",
        entity,
        entityId: item.id,
        previous: { status: "DRAFT" },
        next: { status: "PUBLISHED" },
      });
      published += 1;
    }
  }

  if (published > 0 || expired > 0) {
    revalidateContent(["rooms", "promotions", "gallery", "reviews", "experiences"]);
  }

  return { published, expired };
}
