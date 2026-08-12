import { db } from "@/lib/db";
import { createCrudApi, toCrudModel } from "@/lib/crud-factory";
import { createPromotionSchema, updatePromotionSchema } from "@/lib/validators";
import { handleApi } from "@/lib/handle-api";

const crud = createCrudApi(toCrudModel(db.promotion), {
  entity: "Promotion",
  entityLabel: "Promosi",
  permission: "promotion",
  cacheTags: ["promotions"],
  createSchema: createPromotionSchema,
  updateSchema: updatePromotionSchema,
  searchFields: ["title", "promoCode"],
  orderBy: { sortOrder: "asc" },
  filterMap: { status: "status" },
});

export const GET = (req: Request) => handleApi(() => crud.list(req));
export const POST = (req: Request) => handleApi(() => crud.create(req));
