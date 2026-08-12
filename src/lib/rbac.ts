import type { Role } from "@/generated/prisma/client";

/**
 * Matriks permission (PRD §36). VIEWER tidak masuk matriks mutation —
 * read-only pun aksesnya dibatasi ke halaman khusus (analytics) di doc 04.
 */
export const PERMISSIONS = {
  content: ["ADMIN", "MARKETING", "EDITOR"],
  promotion: ["ADMIN", "MARKETING", "EDITOR"],
  publish: ["ADMIN", "MARKETING"],
  analytics: ["ADMIN", "MARKETING"],
  settings: ["ADMIN"],
  users: ["ADMIN"],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: Role, permission: Permission): boolean {
  return (PERMISSIONS[permission] as readonly Role[]).includes(role);
}
