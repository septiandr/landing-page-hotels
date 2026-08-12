import { z } from "zod";
import {
  contentStatusSchema,
  optionalDate,
  optionalString,
  requiredString,
  textArea,
} from "./common";

/** Base tanpa default — update memakai partial dari base ini (tidak me-reset). */
const testimonialBaseSchema = z.object({
  guestName: requiredString,
  country: optionalString,
  rating: z.coerce.number("Rating harus berupa angka").int("Rating harus bilangan bulat").min(1).max(5),
  review: textArea,
  source: optionalString,
  status: contentStatusSchema,
  publishedAt: optionalDate,
});

export const createTestimonialSchema = testimonialBaseSchema
  .extend({
    rating: z.coerce
      .number("Rating harus berupa angka")
      .int("Rating harus bilangan bulat")
      .min(1)
      .max(5)
      .default(5),
    status: contentStatusSchema.default("DRAFT"),
  })
  .strict();

export const updateTestimonialSchema = testimonialBaseSchema.partial().strict();

export type TestimonialInput = z.infer<typeof createTestimonialSchema>;
export type TestimonialUpdateInput = z.infer<typeof updateTestimonialSchema>;
