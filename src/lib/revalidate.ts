import { revalidatePath, revalidateTag } from "next/cache";

/** Tag ISR per entity — dipakai fetch data layer publik (LP-*). */
export const CONTENT_TAGS = [
  "rooms",
  "promotions",
  "gallery",
  "amenities",
  "hotel",
  "faq",
  "reviews",
  "experiences",
  "attractions",
] as const;

export type ContentTag = (typeof CONTENT_TAGS)[number];

/** Peta entity → tag untuk konsistensi di seluruh CMS. */
export const TAG_BY_ENTITY: Record<string, ContentTag> = {
  Room: "rooms",
  Promotion: "promotions",
  GalleryItem: "gallery",
  Amenity: "amenities",
  Hotel: "hotel",
  FaqItem: "faq",
  Testimonial: "reviews",
  Experience: "experiences",
  Attraction: "attractions",
};

/**
 * Invalidasi cache konten publik setelah mutation.
 * - revalidateTag  → untuk data yang memakai fetch tags (LP-*)
 * - revalidatePath → untuk halaman statis/ISR yang query DB langsung
 *   (revalidateTag tidak berefek ke data non-fetch, jadi path dipaksa ulang)
 */
export function revalidateContent(tags: ContentTag[]): void {
  for (const tag of tags) {
    try {
      // Next 16: revalidateTag butuh profile/cacheLife — expire 0 = revalidate sekarang.
      revalidateTag(tag, { expire: 0 });
    } catch {
      // Tag belum terdaftar di fetch manapun — no-op.
    }
  }
  // Halaman publik utama.
  try {
    revalidatePath("/", "page");
  } catch {
    // no-op (dev)
  }
  try {
    revalidatePath("/rooms", "page");
  } catch {
    // no-op (dev)
  }
}
