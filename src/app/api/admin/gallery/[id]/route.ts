import { db } from "@/lib/db";
import { createCrudApi, toCrudModel } from "@/lib/crud-factory";
import { createGalleryItemSchema, updateGalleryItemSchema } from "@/lib/validators";
import { handleApi } from "@/lib/handle-api";

const crud = createCrudApi(toCrudModel(db.galleryItem), {
  entity: "GalleryItem",
  entityLabel: "Foto galeri",
  permission: "content",
  cacheTags: ["gallery"],
  createSchema: createGalleryItemSchema,
  updateSchema: updateGalleryItemSchema,
  searchFields: ["altText", "caption"],
  orderBy: { sortOrder: "asc" },
  filterMap: { category: "category", status: "status" },
});

type IdCtx = { params: Promise<{ id: string }> };

export const GET = (_req: Request, ctx: IdCtx) =>
  handleApi(async () => crud.getById((await ctx.params).id));

export const PATCH = (req: Request, ctx: IdCtx) =>
  handleApi(async () => crud.update((await ctx.params).id, req));

export const DELETE = (_req: Request, ctx: IdCtx) =>
  handleApi(async () => crud.remove((await ctx.params).id));
