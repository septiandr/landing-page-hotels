import { z } from "zod";
import { faqCategorySchema, requiredString, sortOrderSchema, textArea } from "./common";

/** Base tanpa default — update memakai partial dari base ini (tidak me-reset). */
const faqBaseSchema = z.object({
  question: requiredString,
  answer: textArea,
  category: faqCategorySchema,
  sortOrder: sortOrderSchema,
});

export const createFaqItemSchema = faqBaseSchema
  .extend({
    category: faqCategorySchema.default("BOOKING"),
    sortOrder: sortOrderSchema.default(0),
  })
  .strict();

export const updateFaqItemSchema = faqBaseSchema.partial().strict();

export type FaqItemInput = z.infer<typeof createFaqItemSchema>;
export type FaqItemUpdateInput = z.infer<typeof updateFaqItemSchema>;
