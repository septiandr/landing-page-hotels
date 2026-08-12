import { auth } from "./auth";
import { db } from "./db";
import { can, type Permission } from "./rbac";
import type { Role } from "@/generated/prisma/client";

/**
 * Preview mode (CMS-U-012).
 *
 * Landing page menampilkan konten draft hanya ketika URL punya `?preview=1`
 * DAN session yang aktif punya permission yang diminta (default `content`).
 * Tanpa kedua syarat itu, query publik tetap memfilter status PUBLISHED.
 *
 * User yang sudah dinonaktifkan (isActive=false) juga tidak bisa preview —
 * dicek langsung ke DB per-request (invalidasi instan, konsisten dengan
 * `requirePermission` di CMS-B-002).
 */
export async function isPreviewMode(
  searchParams?: { preview?: string | string[] },
  permission: Permission = "content",
): Promise<boolean> {
  const raw = searchParams?.preview;
  const on = Array.isArray(raw) ? raw[0] : raw;
  if (on !== "1") return false;

  const session = await auth();
  const role = session?.user?.role as Role | undefined;
  if (!session?.user?.id || !role || !can(role, permission)) return false;

  const dbUser = await db.user.findUnique({
    where: { id: session.user.id },
    select: { isActive: true },
  });
  return dbUser?.isActive === true;
}
