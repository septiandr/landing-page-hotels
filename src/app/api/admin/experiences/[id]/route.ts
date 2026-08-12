import { db } from "@/lib/db";
import { createCrudApi, toCrudModel } from "@/lib/crud-factory";
import { createExperienceSchema, updateExperienceSchema } from "@/lib/validators";
import { handleApi } from "@/lib/handle-api";

const crud = createCrudApi(toCrudModel(db.experience), {
  entity: "Experience",
  entityLabel: "Pengalaman",
  permission: "content",
  cacheTags: ["experiences"],
  createSchema: createExperienceSchema,
  updateSchema: updateExperienceSchema,
  searchFields: ["title"],
  orderBy: { sortOrder: "asc" },
  filterMap: { status: "status" },
});

type IdCtx = { params: Promise<{ id: string }> };

export const GET = (_req: Request, ctx: IdCtx) =>
  handleApi(async () => crud.getById((await ctx.params).id));

export const PATCH = (req: Request, ctx: IdCtx) =>
  handleApi(async () => crud.update((await ctx.params).id, req));

export const DELETE = (_req: Request, ctx: IdCtx) =>
  handleApi(async () => crud.remove((await ctx.params).id));
