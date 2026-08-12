import { db } from "@/lib/db";
import { createCrudApi, toCrudModel } from "@/lib/crud-factory";
import { createAmenitySchema, updateAmenitySchema } from "@/lib/validators";
import { handleApi } from "@/lib/handle-api";

const crud = createCrudApi(toCrudModel(db.amenity), {
  entity: "Amenity",
  entityLabel: "Fasilitas",
  permission: "content",
  cacheTags: ["amenities"],
  createSchema: createAmenitySchema,
  updateSchema: updateAmenitySchema,
  searchFields: ["name"],
  orderBy: { sortOrder: "asc" },
  filterMap: { group: "group" },
});

export const GET = (req: Request) => handleApi(() => crud.list(req));
export const POST = (req: Request) => handleApi(() => crud.create(req));
