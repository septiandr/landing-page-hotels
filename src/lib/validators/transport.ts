import { z } from "zod";
import { moneySchema, optionalString, requiredString, sortOrderSchema } from "./common";

/** Base tanpa default — update memakai partial dari base ini (tidak me-reset). */
const transportBaseSchema = z.object({
  title: requiredString,
  description: optionalString,
  icon: optionalString,
  priceFrom: moneySchema.nullable().optional(),
  ctaLabel: optionalString,
  ctaUrl: z.url("URL tidak valid").nullable().optional(),
  sortOrder: sortOrderSchema,
});

export const createTransportSchema = transportBaseSchema
  .extend({ sortOrder: sortOrderSchema.default(0) })
  .strict();
export const updateTransportSchema = transportBaseSchema.partial().strict();

export type TransportInput = z.infer<typeof createTransportSchema>;
export type TransportUpdateInput = z.infer<typeof updateTransportSchema>;
