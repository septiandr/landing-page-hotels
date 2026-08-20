import type { Session } from "next-auth";
import { auth } from "./auth";
import { db } from "./db";
import { ApiError } from "./api-error";
import { PERMISSIONS, type Permission } from "./rbac";
import type { Role } from "@/generated/prisma/client";

export interface AuthedContext {
  session: Session | null;
  user: NonNullable<Session["user"]>;
  role: Role;
}

/**
 * Gate utama semua endpoint CMS (CMS-B-002).
 * - Tanpa session        → 401
 * - User nonaktif        → 401 (langsung cek DB — invalidasi instan, CMS-B-011)
 * - Role tanpa permission → 403
 */
export async function requirePermission(action: Permission): Promise<AuthedContext> {
  const session = await auth();
  const user = session?.user;
  if (!user) throw new ApiError(401, "Unauthorized");

  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    select: { isActive: true },
  });
  if (!dbUser?.isActive) throw new ApiError(401, "Unauthorized");

  const role = user.role as Role;
  if (!(PERMISSIONS[action] as readonly Role[]).includes(role)) {
    throw new ApiError(403, "Forbidden");
  }

  return { session, user, role };
}

/**
 * Gate GET read-only: role dengan permission action, ATAU VIEWER (baca saja).
 * Mutation tetap harus `requirePermission` penuh (OSB-006).
 */
export async function requirePermissionWithRead(
  action: Permission,
): Promise<AuthedContext> {
  try {
    return await requirePermission(action);
  } catch (err) {
    // VIEWER diizinkan baca — selain itu re-throw.
    if (err instanceof ApiError && err.status === 403) {
      const session = await auth();
      const user = session?.user;
      if (user && user.role === "VIEWER") {
        const dbUser = await db.user.findUnique({
          where: { id: user.id },
          select: { isActive: true },
        });
        if (dbUser?.isActive) return { session, user, role: "VIEWER" };
      }
    }
    throw err;
  }
}
