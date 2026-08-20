import type { NextConfig } from "next";

// SEC-001 — CSP hanya mengizinkan domain vendor yang AKTIF (jangan blanket).
const gtmId = process.env.NEXT_PUBLIC_GTM_ID;
const ga4Id = process.env.NEXT_PUBLIC_GA4_ID;
const metaId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const tiktokId = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID;
const cloudbedsActive = process.env.BOOKING_ENGINE_PROVIDER === "cloudbeds";

// gtag.js (GA4) juga di-load dari googletagmanager.com.
const gtmHosts = gtmId || ga4Id ? " https://www.googletagmanager.com" : "";
const ga4Connect = ga4Id ? " https://www.google-analytics.com https://analytics.google.com" : "";
const metaHosts = metaId ? " https://connect.facebook.net" : "";
const tiktokHosts = tiktokId ? " https://analytics.tiktok.com" : "";
const cbHosts = cloudbedsActive ? " https://*.cloudbeds.com" : "";

// React dev-mode butuh eval() untuk debugging; production menolak unsafe-eval.
const evalSrc = process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : "";

const contentSecurityPolicy = [
  "default-src 'self'",
  // 'unsafe-inline' wajib untuk inline bootstrap script Next.js (production).
  `script-src 'self' 'unsafe-inline'${evalSrc}${gtmHosts}${metaHosts}${tiktokHosts}${cbHosts}`,
  "style-src 'self' 'unsafe-inline'",
  // data:/blob: untuk next/image; googleusercontent untuk avatar/thumb eksternal.
  "img-src 'self' data: blob: https://images.unsplash.com https://*.googleusercontent.com https://maps.google.com https://www.google.com",
  "font-src 'self' data:",
  `connect-src 'self'${ga4Connect}${cbHosts}`,
  // Google Maps embed iframe (LP-013).
  "frame-src https://maps.google.com https://www.google.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: contentSecurityPolicy,
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  // HSTS hanya di production (localhost dev memicu warning browser).
  ...(process.env.NODE_ENV === "production"
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
    : []),
];

const nextConfig: NextConfig = {
  images: {
    // Gambar placeholder seed (Unsplash) + CDN hotel nanti.
    // Catatan: `images.domains` deprecated di Next 16 — pakai remotePatterns.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
      },
    ],
  },
  // Security headers (CMS-B-012 / SEC-001) + cache policy (PERF-006).
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // PERF-006: halaman publik di-cache CDN (60s + SWR 5m) — konten CMS berubah
      // jarang; isi berubah hanya via mutation admin yang revalidate tag.
      {
        source: "/",
        headers: [{ key: "Cache-Control", value: "public, s-maxage=60, stale-while-revalidate=300" }],
      },
      {
        source: "/rooms/:path*",
        headers: [{ key: "Cache-Control", value: "public, s-maxage=60, stale-while-revalidate=300" }],
      },
      // API real-time (availability) & auth tidak boleh di-cache CDN.
      {
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
    ];
  },
};

export default nextConfig;
