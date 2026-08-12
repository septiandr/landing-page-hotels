import NextAuth from "next-auth";
import { authConfig } from "./lib/auth.config";

/**
 * Proxy proteksi halaman /admin/* — redirect ke /admin/login bila
 * belum login (lihat callback `authorized` di lib/auth.config.ts).
 * API /api/admin/* tidak di-matching di sini; keamanannya di-handle
 * per-route oleh lib/require.ts (401/403 JSON).
 *
 * Next.js 16: file convention `proxy.ts` menggantikan `middleware.ts`
 * (middleware deprecated). Named export `proxy`.
 */
export const proxy = NextAuth(authConfig).auth;

export const config = {
  matcher: ["/admin/:path*"],
};
