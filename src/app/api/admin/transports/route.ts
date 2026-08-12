import { db } from "@/lib/db";
import { createCrudApi, toCrudModel } from "@/lib/crud-factory";
import { createTransportSchema, updateTransportSchema } from "@/lib/validators";
import { handleApi } from "@/lib/handle-api";

const crud = createCrudApi(toCrudModel(db.transportOption), {
  entity: "TransportOption",
  entityLabel: "Transportasi",
  permission: "content",
  cacheTags: ["transports"],
  createSchema: createTransportSchema,
  updateSchema: updateTransportSchema,
  searchFields: ["title"],
  orderBy: { sortOrder: "asc" },
});

export const GET = (req: Request) => handleApi(() => crud.list(req));
export const POST = (req: Request) => handleApi(() => crud.create(req));
