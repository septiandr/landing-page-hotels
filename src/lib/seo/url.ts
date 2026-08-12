import { env } from "@/lib/env";

/** Base URL situs (tanpa trailing slash). */
export function siteUrl(): string {
  return env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
}

/** Ubah path relatif ("/uploads/x.jpg") jadi URL absolut. */
export function absoluteUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (/^https?:\/\//.test(path)) return path;
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}
