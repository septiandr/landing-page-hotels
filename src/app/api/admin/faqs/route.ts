import { db } from "@/lib/db";
import { createCrudApi, toCrudModel } from "@/lib/crud-factory";
import { createFaqItemSchema, updateFaqItemSchema } from "@/lib/validators";
import { handleApi } from "@/lib/handle-api";

const crud = createCrudApi(toCrudModel(db.faqItem), {
  entity: "FaqItem",
  entityLabel: "FAQ",
  permission: "content",
  cacheTags: ["faq"],
  createSchema: createFaqItemSchema,
  updateSchema: updateFaqItemSchema,
  searchFields: ["question", "answer"],
  orderBy: { sortOrder: "asc" },
  filterMap: { category: "category" },
});

export const GET = (req: Request) => handleApi(() => crud.list(req));
export const POST = (req: Request) => handleApi(() => crud.create(req));
