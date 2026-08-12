import { db } from "@/lib/db";
import { createCrudApi, toCrudModel } from "@/lib/crud-factory";
import { createAttractionSchema, updateAttractionSchema } from "@/lib/validators";
import { handleApi } from "@/lib/handle-api";

const crud = createCrudApi(toCrudModel(db.attraction), {
  entity: "Attraction",
  entityLabel: "Wisata",
  permission: "content",
  cacheTags: ["attractions"],
  createSchema: createAttractionSchema,
  updateSchema: updateAttractionSchema,
  searchFields: ["name"],
  orderBy: { sortOrder: "asc" },
});

export const GET = (req: Request) => handleApi(() => crud.list(req));
export const POST = (req: Request) => handleApi(() => crud.create(req));
