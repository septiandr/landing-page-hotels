import { z } from "zod";
import {
  coerceBool,
  contentStatusSchema,
  currencySchema,
  imageUrlOrPath,
  moneySchema,
  optionalString,
  requiredString,
  slugSchema,
  sortOrderSchema,
} from "./common";

const roomPhotoSchema = z
  .object({
    url: imageUrlOrPath,
    altText: requiredString, // wajib — sinkron dengan RoomPhoto.altText (non-null)
    sortOrder: sortOrderSchema.default(0),
  })
  .strict();

const roomAmenitySchema = z
  .object({
    name: requiredString,
    icon: optionalString,
  })
  .strict();

/** Base tanpa default — update memakai partial dari base ini (tidak me-reset). */
const roomBaseSchema = z.object({
  slug: slugSchema,
  name: requiredString,
  description: optionalString,
  sizeM2: z.coerce.number("Luas kamar harus berupa angka").int().positive().nullable().optional(),
  maxOccupancy: z.coerce
    .number("Kapasitas harus berupa angka")
    .int()
    .positive()
    .nullable()
    .optional(),
  bedType: optionalString,
  bedCount: z.coerce.number().int().positive().nullable().optional(),
  view: optionalString,
  priceFrom: moneySchema.nullable().optional(),
  currency: currencySchema,
  breakfastIncluded: coerceBool,
  status: contentStatusSchema,
  sortOrder: sortOrderSchema,
  amenities: z.array(roomAmenitySchema).max(30).optional(),
  photos: z.array(roomPhotoSchema).max(20).optional(),
});

/** Schema create Room — strict, slug + price divalidasi. */
export const createRoomSchema = roomBaseSchema
  .extend({
    currency: currencySchema.default("IDR"),
    breakfastIncluded: coerceBool.default(false),
    status: contentStatusSchema.default("DRAFT"),
    sortOrder: sortOrderSchema.default(0),
  })
  .strict();

/** Update = partial base (tanpa default) — field yang tidak dikirim tidak berubah. */
export const updateRoomSchema = roomBaseSchema.partial().strict();

export type RoomInput = z.infer<typeof createRoomSchema>;
export type RoomUpdateInput = z.infer<typeof updateRoomSchema>;
