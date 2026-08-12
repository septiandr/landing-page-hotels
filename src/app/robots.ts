import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

/** SEO-003 — robots.txt: allow all (kecuali area admin & API) + sitemap URL. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api"] }],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
