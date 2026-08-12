import NextAuth from "next-auth";
import { authConfig } from "./lib/auth.config";

/**
 * Middleware proteksi halaman /admin/* — redirect ke /admin/login bila
 * belum login (lihat callback `authorized` di lib/auth.config.ts).
 * API /api/admin/* tidak di-matching di sini; keamanannya di-handle
 * per-route oleh lib/require.ts (401/403 JSON).
 */
export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/admin/:path*"],
};
