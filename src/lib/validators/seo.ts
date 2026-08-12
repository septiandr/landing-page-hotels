import { z } from "zod";
import { optionalImage, optionalString } from "./common";

/** Schema SeoMeta (selalu create/update bersama Hotel). */
export const seoSchema = z
  .object({
    metaTitle: optionalString,
    metaDescription: optionalString,
    ogTitle: optionalString,
    ogDescription: optionalString,
    ogImage: optionalImage,
    canonicalUrl: z.url("URL kanonikal tidak valid").nullable().optional(),
  })
  .strict();

export const updateSeoSchema = seoSchema.partial();

export type SeoInput = z.infer<typeof seoSchema>;
export type SeoUpdateInput = z.infer<typeof updateSeoSchema>;
