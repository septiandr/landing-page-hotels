import { z } from "zod";
import {
  coerceBool,
  optionalDate,
  optionalImage,
  optionalString,
  promotionStatusSchema,
  requiredString,
  sortOrderSchema,
} from "./common";

/**
 * Base tanpa default. Catatan Zod 4: `.partial()` tidak bisa dipakai pada
 * schema yang punya `.refine()` — update memakai partial dari base ini,
 * sehingga update promotion TIDAK memvalidasi silang bookingStart/End
 * (hanya create). Konsumen update harus memvalidasi periode di handler.
 */
const promotionBaseSchema = z.object({
  title: requiredString,
  description: optionalString,
  image: optionalImage,
  discountLabel: optionalString,
  promoCode: optionalString,
  bookingStart: optionalDate,
  bookingEnd: optionalDate,
  stayStart: optionalDate,
  stayEnd: optionalDate,
  terms: optionalString,
  ctaLabel: optionalString,
  status: promotionStatusSchema,
  scheduledPublishAt: optionalDate,
  showCountdown: coerceBool,
  sortOrder: sortOrderSchema,
});

/**
 * Schema create Promotion — strict + validasi silang periode booking.
 * Status efektif dihitung di lib/promotions.ts (query layer), validator ini
 * hanya memvalidasi bentuk input.
 */
export const createPromotionSchema = promotionBaseSchema
  .extend({
    ctaLabel: optionalString.default("Book Now"),
    status: promotionStatusSchema.default("DRAFT"),
    showCountdown: coerceBool.default(false),
    sortOrder: sortOrderSchema.default(0),
  })
  .strict()
  .refine((d) => !d.bookingStart || !d.bookingEnd || d.bookingStart <= d.bookingEnd, {
    message: "bookingStart harus lebih awal atau sama dengan bookingEnd",
    path: ["bookingEnd"],
  })
  .refine((d) => !d.stayStart || !d.stayEnd || d.stayStart <= d.stayEnd, {
    message: "stayStart harus lebih awal atau sama dengan stayEnd",
    path: ["stayEnd"],
  });

export const updatePromotionSchema = promotionBaseSchema.partial().strict();

export type PromotionInput = z.infer<typeof createPromotionSchema>;
export type PromotionUpdateInput = z.infer<typeof updatePromotionSchema>;
