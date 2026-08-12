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

export const GET = (req: Request) => handleApi(() => crud.list(req));
export const POST = (req: Request) => handleApi(() => crud.create(req));
