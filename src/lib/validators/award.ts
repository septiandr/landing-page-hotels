import { z } from "zod";
import { optionalImage, optionalString, requiredString, sortOrderSchema } from "./common";

/** Base tanpa default — update memakai partial dari base ini (tidak me-reset). */
const awardBaseSchema = z.object({
  name: requiredString,
  issuer: optionalString,
  year: z.coerce
    .number("Tahun harus berupa angka")
    .int("Tahun harus bilangan bulat")
    .min(1900, "Tahun minimal 1900")
    .max(2100, "Tahun maksimal 2100")
    .nullable()
    .optional(),
  logo: optionalImage,
  sortOrder: sortOrderSchema,
});

export const createAwardSchema = awardBaseSchema.extend({ sortOrder: sortOrderSchema.default(0) }).strict();
export const updateAwardSchema = awardBaseSchema.partial().strict();

export type AwardInput = z.infer<typeof createAwardSchema>;
export type AwardUpdateInput = z.infer<typeof updateAwardSchema>;
