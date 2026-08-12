import type { NextAuthConfig } from "next-auth";

/**
 * Konfigurasi Auth.js yang edge-safe (dipakai middleware).
 * Provider Credentials (yang butuh Prisma/bcrypt) diisi di lib/auth.ts —
 * pola standar Auth.js v5 agar middleware tidak meng-import kode Node.
 */
export const authConfig = {
  pages: {
    signIn: "/admin/login",
  },
  session: {
    strategy: "jwt",
  },
  // Diperlukan di production (next start / Vercel) — tanpa ini Auth.js v5
  // menolak host: "UntrustedHost". Di Vercel otomatis via AUTH_TRUST_HOST.
  trustHost: true,
  providers: [], // diisi di lib/auth.ts
  callbacks: {
    /**
     * Gate akses halaman /admin/* — tanpa login di-redirect ke /admin/login.
     * RBAC per-action dilakukan server-side di lib/require.ts.
     */
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = request.nextUrl;

      if (pathname.startsWith("/admin")) {
        if (isLoggedIn) return true;
        // Halaman login tetap bisa diakses saat belum login.
        return pathname === "/admin/login";
      }
      return true;
    },
  },
} satisfies NextAuthConfig;
