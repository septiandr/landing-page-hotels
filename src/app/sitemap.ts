import type { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { siteUrl } from "@/lib/seo";

/** SEO-003 — Sitemap: home, semua room published, halaman statis. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();

  const rooms = await db.room
    .findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, updatedAt: true },
      orderBy: { sortOrder: "asc" },
    })
    .catch(() => []);

  const staticPages: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/cancellation-policy`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const roomPages: MetadataRoute.Sitemap = rooms.map((room) => ({
    url: `${base}/rooms/${room.slug}`,
    lastModified: room.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticPages, ...roomPages];
}
