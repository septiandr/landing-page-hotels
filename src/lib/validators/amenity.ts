import { z } from "zod";
import {
  amenityGroupSchema,
  optionalImage,
  optionalString,
  requiredString,
  sortOrderSchema,
} from "./common";

/** Base tanpa default — update memakai partial dari base ini (tidak me-reset). */
const amenityBaseSchema = z.object({
  name: requiredString,
  icon: optionalString,
  description: optionalString,
  image: optionalImage,
  group: amenityGroupSchema,
  sortOrder: sortOrderSchema,
});

export const createAmenitySchema = amenityBaseSchema
  .extend({
    group: amenityGroupSchema.default("HOTEL"),
    sortOrder: sortOrderSchema.default(0),
  })
  .strict();

export const updateAmenitySchema = amenityBaseSchema.partial().strict();

export type AmenityInput = z.infer<typeof createAmenitySchema>;
export type AmenityUpdateInput = z.infer<typeof updateAmenitySchema>;
