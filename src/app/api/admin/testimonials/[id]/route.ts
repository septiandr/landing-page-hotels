import { db } from "@/lib/db";
import { createCrudApi, toCrudModel } from "@/lib/crud-factory";
import { createTestimonialSchema, updateTestimonialSchema } from "@/lib/validators";
import { handleApi } from "@/lib/handle-api";

const crud = createCrudApi(toCrudModel(db.testimonial), {
  entity: "Testimonial",
  entityLabel: "Testimoni",
  permission: "content",
  cacheTags: ["reviews"],
  createSchema: createTestimonialSchema,
  updateSchema: updateTestimonialSchema,
  searchFields: ["guestName", "review"],
  orderBy: { createdAt: "desc" },
  filterMap: { status: "status", source: "source" },
});

type IdCtx = { params: Promise<{ id: string }> };

export const GET = (_req: Request, ctx: IdCtx) =>
  handleApi(async () => crud.getById((await ctx.params).id));

export const PATCH = (req: Request, ctx: IdCtx) =>
  handleApi(async () => crud.update((await ctx.params).id, req));

export const DELETE = (_req: Request, ctx: IdCtx) =>
  handleApi(async () => crud.remove((await ctx.params).id));
