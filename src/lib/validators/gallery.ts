import { z } from "zod";
import {
  contentStatusSchema,
  galleryCategorySchema,
  imageUrlOrPath,
  optionalImage,
  optionalString,
  requiredString,
  sortOrderSchema,
} from "./common";

/** Base tanpa default — update memakai partial dari base ini (tidak me-reset). */
const galleryBaseSchema = z.object({
  image: imageUrlOrPath,
  thumb: optionalImage,
  altText: requiredString,
  caption: optionalString,
  category: galleryCategorySchema,
  status: contentStatusSchema,
  sortOrder: sortOrderSchema,
});

export const createGalleryItemSchema = galleryBaseSchema
  .extend({
    category: galleryCategorySchema.default("ALL"),
    status: contentStatusSchema.default("PUBLISHED"),
    sortOrder: sortOrderSchema.default(0),
  })
  .strict();

export const updateGalleryItemSchema = galleryBaseSchema.partial().strict();

export type GalleryItemInput = z.infer<typeof createGalleryItemSchema>;
export type GalleryItemUpdateInput = z.infer<typeof updateGalleryItemSchema>;
