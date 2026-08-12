import { z } from "zod";
import {
  contentStatusSchema,
  moneySchema,
  optionalImage,
  optionalString,
  requiredString,
  sortOrderSchema,
} from "./common";

/** Base tanpa default — update memakai partial dari base ini (tidak me-reset). */
const experienceBaseSchema = z.object({
  title: requiredString,
  description: optionalString,
  image: optionalImage,
  duration: optionalString,
  priceFrom: moneySchema.nullable().optional(),
  ctaLabel: optionalString,
  ctaUrl: z.url("URL CTA tidak valid").nullable().optional(),
  status: contentStatusSchema,
  sortOrder: sortOrderSchema,
});

export const createExperienceSchema = experienceBaseSchema
  .extend({
    ctaLabel: optionalString.default("Book"),
    status: contentStatusSchema.default("DRAFT"),
    sortOrder: sortOrderSchema.default(0),
  })
  .strict();

export const updateExperienceSchema = experienceBaseSchema.partial().strict();

export type ExperienceInput = z.infer<typeof createExperienceSchema>;
export type ExperienceUpdateInput = z.infer<typeof updateExperienceSchema>;
