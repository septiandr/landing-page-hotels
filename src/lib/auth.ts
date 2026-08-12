import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { authConfig } from "./auth.config";
import { verifyPassword } from "./password";
import { db } from "./db";
import { clearFailures, isBlocked, recordFailure } from "./rate-limit";

const credentialsSchema = z.object({
  email: z.email("Email tidak valid").transform((v) => v.toLowerCase()),
  password: z.string().min(1, "Password wajib diisi"),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      /**
       * Defense-in-depth rate limit: POST langsung ke
       * /api/auth/callback/credentials (tanpa melewati server action login)
       * tetap dibatasi 5 kegagalan/15 menit — sekaligus mencegah spam
       * LOGIN_FAILED ke audit table. Key namespace terpisah dari server
       * action agar tidak dobel-hit untuk percobaan lewat form.
       */
      async authorize(credentials, request) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const ip = request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
        const rlKey = `login-cb:${ip}:${email}`;

        if (isBlocked(rlKey).blocked) return null;

        const user = await db.user.findUnique({ where: { email } });

        // Pesan generik — jangan bocorkan apakah email terdaftar (CMS-B-001 DoD).
        if (!user || !user.isActive) {
          recordFailure(rlKey);
          await db.auditLog.create({
            data: { userId: user?.id ?? null, action: "LOGIN_FAILED", entity: "User" },
          });
          return null;
        }

        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) {
          recordFailure(rlKey);
          await db.auditLog.create({
            data: { userId: user.id, action: "LOGIN_FAILED", entity: "User", entityId: user.id },
          });
          return null;
        }

        clearFailures(rlKey);
        await db.auditLog.create({
          data: { userId: user.id, action: "LOGIN", entity: "User", entityId: user.id },
        });

        return { id: user.id, name: user.name, email: user.email, role: user.role };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id ?? "";
        session.user.role = token.role ?? "VIEWER";
      }
      return session;
    },
  },
});
