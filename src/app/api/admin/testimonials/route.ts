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

export const GET = (req: Request) => handleApi(() => crud.list(req));
export const POST = (req: Request) => handleApi(() => crud.create(req));
