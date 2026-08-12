import { db } from "./db";
import { ApiError } from "./api-error";
import { requirePermission } from "./require";
import { audit } from "./audit";
import { revalidateContent, TAG_BY_ENTITY, type ContentTag } from "./revalidate";

export type PublishableEntity =
  | "Room"
  | "Promotion"
  | "GalleryItem"
  | "Testimonial"
  | "Experience";

/** Bentuk minimal model yang bisa publish/unpublish. */
interface PublishModel {
  findUnique(args: { where: { id: string } }): Promise<{ id: string; status: string } | null>;
  update(args: { where: { id: string }; data: Record<string, unknown> }): Promise<unknown>;
}

function modelOf(entity: PublishableEntity): PublishModel {
  switch (entity) {
    case "Room":
      return db.room as unknown as PublishModel;
    case "Promotion":
      return db.promotion as unknown as PublishModel;
    case "GalleryItem":
      return db.galleryItem as unknown as PublishModel;
    case "Testimonial":
      return db.testimonial as unknown as PublishModel;
    case "Experience":
      return db.experience as unknown as PublishModel;
  }
}

function statusOf(entity: PublishableEntity) {
  return entity === "Promotion"
    ? { published: "ACTIVE", draft: "DRAFT" }
    : { published: "PUBLISHED", draft: "DRAFT" };
}

function tagsOf(entity: PublishableEntity): ContentTag[] {
  return [TAG_BY_ENTITY[entity] as ContentTag];
}

/** DRAFT → PUBLISHED/ACTIVE (permission: publish). */
export async function publishEntity(entity: PublishableEntity, id: string) {
  const { user } = await requirePermission("publish");
  const model = modelOf(entity);
  const current = await model.findUnique({ where: { id } });
  if (!current) throw new ApiError(404, "Data tidak ditemukan");

  const nextStatus = statusOf(entity).published;
  const data = await model.update({ where: { id }, data: { status: nextStatus } });
  await audit({
    action: "PUBLISH",
    entity,
    entityId: id,
    previous: { status: current.status },
    next: { status: nextStatus },
    userId: user.id,
  });
  revalidateContent(tagsOf(entity));
  return data;
}

/** PUBLISHED → DRAFT (permission: publish). */
export async function unpublishEntity(entity: PublishableEntity, id: string) {
  const { user } = await requirePermission("publish");
  const model = modelOf(entity);
  const current = await model.findUnique({ where: { id } });
  if (!current) throw new ApiError(404, "Data tidak ditemukan");

  const draftStatus = statusOf(entity).draft;
  const data = await model.update({ where: { id }, data: { status: draftStatus } });
  await audit({
    action: "UNPUBLISH",
    entity,
    entityId: id,
    previous: { status: current.status },
    next: { status: draftStatus },
    userId: user.id,
  });
  revalidateContent(tagsOf(entity));
  return data;
}

/** Jadwalkan publish — set scheduledPublishAt; cron memproses saat tiba. */
export async function schedulePublish(entity: PublishableEntity, id: string, at: Date) {
  const { user } = await requirePermission("publish");
  const model = modelOf(entity);
  const current = await model.findUnique({ where: { id } });
  if (!current) throw new ApiError(404, "Data tidak ditemukan");

  // Promotion pakai status SCHEDULED (cron mencari SCHEDULED + scheduledPublishAt);
  // entity konten tetap DRAFT sampai waktunya tiba.
  const scheduledStatus = entity === "Promotion" ? "SCHEDULED" : statusOf(entity).draft;
  const data = await model.update({
    where: { id },
    data: { scheduledPublishAt: at, status: scheduledStatus },
  });
  await audit({
    action: "UPDATE",
    entity,
    entityId: id,
    previous: { scheduledPublishAt: null, status: current.status },
    next: { scheduledPublishAt: at, status: scheduledStatus },
    userId: user.id,
  });
  revalidateContent(tagsOf(entity));
  return data;
}
