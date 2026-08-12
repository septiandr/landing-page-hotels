import { db } from "@/lib/db";
import { createCrudApi, toCrudModel } from "@/lib/crud-factory";
import { createAwardSchema, updateAwardSchema } from "@/lib/validators";
import { handleApi } from "@/lib/handle-api";

const crud = createCrudApi(toCrudModel(db.award), {
  entity: "Award",
  entityLabel: "Penghargaan",
  permission: "content",
  cacheTags: ["awards"],
  createSchema: createAwardSchema,
  updateSchema: updateAwardSchema,
  searchFields: ["name", "issuer"],
  orderBy: { sortOrder: "asc" },
});

type IdCtx = { params: Promise<{ id: string }> };

export const GET = (_req: Request, ctx: IdCtx) =>
  handleApi(async () => crud.getById((await ctx.params).id));

export const PATCH = (req: Request, ctx: IdCtx) =>
  handleApi(async () => crud.update((await ctx.params).id, req));

export const DELETE = (_req: Request, ctx: IdCtx) =>
  handleApi(async () => crud.remove((await ctx.params).id));
