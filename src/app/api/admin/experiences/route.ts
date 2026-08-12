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

export const GET = (req: Request) => handleApi(() => crud.list(req));
export const POST = (req: Request) => handleApi(() => crud.create(req));
