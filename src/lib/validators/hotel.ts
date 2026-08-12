import { z } from "zod";
import {
  currencySchema,
  emailSchema,
  latSchema,
  lngSchema,
  optionalImage,
  optionalString,
  requiredString,
  timeSchema,
  whatsappSchema,
} from "./common";

const socialLinksSchema = z
  .object({
    instagram: z.url("URL Instagram tidak valid").optional(),
    facebook: z.url("URL Facebook tidak valid").optional(),
    tiktok: z.url("URL TikTok tidak valid").optional(),
  })
  .strict()
  .nullable()
  .optional();

/** Base tanpa default — update memakai partial dari base ini (tidak me-reset). */
const hotelBaseSchema = z.object({
  name: requiredString,
  logo: optionalImage,
  tagline: optionalString,
  description: optionalString,
  story: optionalString,
  address: optionalString,
  phone: optionalString,
  email: emailSchema.nullable().optional(),
  whatsapp: whatsappSchema,
  socialLinks: socialLinksSchema,
  lat: latSchema.nullable().optional(),
  lng: lngSchema.nullable().optional(),
  checkInTime: timeSchema,
  checkOutTime: timeSchema,
  currency: currencySchema,
});

/** Schema create Hotel — strict (tolak field tak dikenal). */
export const createHotelSchema = hotelBaseSchema
  .extend({
    checkInTime: timeSchema.default("14:00"),
    checkOutTime: timeSchema.default("12:00"),
    currency: currencySchema.default("IDR"),
  })
  .strict();

export const updateHotelSchema = hotelBaseSchema.partial().strict();

export type HotelInput = z.infer<typeof createHotelSchema>;
export type HotelUpdateInput = z.infer<typeof updateHotelSchema>;
