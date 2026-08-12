import type { Metadata } from "next";
import { getHotel } from "./data";

/** siteUrl/absoluteUrl (pure, tanpa db) ada di ./seo/url — import + re-export. */
import { absoluteUrl, siteUrl } from "./seo/url";
export { absoluteUrl, siteUrl };

/**
 * SEO-001 — Metadata dari CMS (field `SeoMeta` hotel) dengan fallback ke
 * data hotel. Dipakai generateMetadata() di root layout.
 *
 * Nilai OG harus path absolut — dipaksa via `absoluteUrl()`.
 */

export async function getHotelMetadata(): Promise<Metadata> {
  const hotel = await getHotel();
  if (!hotel) {
    return {
      title: { default: "Hotel Direct Booking", template: "%s | Hotel Direct Booking" },
    };
  }

  const seo = hotel.seo;
  const ogImage = absoluteUrl(seo?.ogImage ?? hotel.logo);

  return {
    title: {
      default: seo?.metaTitle ?? hotel.name,
      template: `%s | ${hotel.name}`,
    },
    description: seo?.metaDescription ?? hotel.description ?? hotel.tagline ?? undefined,
    alternates: { canonical: seo?.canonicalUrl ?? siteUrl() },
    openGraph: {
      type: "website",
      locale: "id_ID",
      siteName: hotel.name,
      title: seo?.ogTitle ?? seo?.metaTitle ?? hotel.name,
      description: seo?.ogDescription ?? seo?.metaDescription ?? hotel.description ?? undefined,
      url: seo?.canonicalUrl ?? siteUrl(),
      images: ogImage ? [{ url: ogImage }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: seo?.ogTitle ?? seo?.metaTitle ?? hotel.name,
      description: seo?.ogDescription ?? hotel.description ?? undefined,
      images: ogImage ? [ogImage] : [],
    },
    robots: { index: true, follow: true },
  };
}
