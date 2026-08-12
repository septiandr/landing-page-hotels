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

type IdCtx = { params: Promise<{ id: string }> };

export const GET = (_req: Request, ctx: IdCtx) =>
  handleApi(async () => crud.getById((await ctx.params).id));

export const PATCH = (req: Request, ctx: IdCtx) =>
  handleApi(async () => crud.update((await ctx.params).id, req));

export const DELETE = (_req: Request, ctx: IdCtx) =>
  handleApi(async () => crud.remove((await ctx.params).id));
