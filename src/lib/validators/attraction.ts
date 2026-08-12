import { z } from "zod";
import {
  latSchema,
  lngSchema,
  optionalImage,
  optionalString,
  requiredString,
  sortOrderSchema,
} from "./common";

/** Base tanpa default — update memakai partial dari base ini (tidak me-reset). */
const attractionBaseSchema = z.object({
  name: requiredString,
  description: optionalString,
  category: optionalString,
  distanceKm: z.coerce.number("Jarak harus berupa angka").nonnegative().nullable().optional(),
  travelTimeMin: z.coerce
    .number("Waktu tempuh harus berupa angka")
    .int()
    .nonnegative()
    .nullable()
    .optional(),
  image: optionalImage,
  lat: latSchema.nullable().optional(),
  lng: lngSchema.nullable().optional(),
  sortOrder: sortOrderSchema,
});

export const createAttractionSchema = attractionBaseSchema
  .extend({ sortOrder: sortOrderSchema.default(0) })
  .strict();

export const updateAttractionSchema = attractionBaseSchema.partial().strict();

export type AttractionInput = z.infer<typeof createAttractionSchema>;
export type AttractionUpdateInput = z.infer<typeof updateAttractionSchema>;
