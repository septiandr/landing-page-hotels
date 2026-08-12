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

type IdCtx = { params: Promise<{ id: string }> };

export const GET = (_req: Request, ctx: IdCtx) =>
  handleApi(async () => crud.getById((await ctx.params).id));

export const PATCH = (req: Request, ctx: IdCtx) =>
  handleApi(async () => crud.update((await ctx.params).id, req));

export const DELETE = (_req: Request, ctx: IdCtx) =>
  handleApi(async () => crud.remove((await ctx.params).id));
