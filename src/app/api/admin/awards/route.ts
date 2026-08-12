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

export const GET = (req: Request) => handleApi(() => crud.list(req));
export const POST = (req: Request) => handleApi(() => crud.create(req));
