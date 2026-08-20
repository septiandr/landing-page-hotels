import { auth } from "./auth";
import { db } from "./db";
import type { Prisma } from "@/generated/prisma/client";

export type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "PUBLISH"
  | "UNPUBLISH"
  | "CHECK_IN"
  | "CHECK_OUT"
  | "CANCEL"
  | "LOGIN"
  | "LOGIN_FAILED";

export interface AuditContext {
  action: AuditAction;
  entity: string;
  entityId?: string | null;
  /** Snapshot sebelum (untuk diff / delete). */
  previous?: unknown;
  /** Snapshot sesudah. */
  next?: unknown;
  /** userId eksplisit (dipakai saat belum ada session, mis. cron/auth). */
  userId?: string | null;
}

/** Tulis AuditLog — userId diambil dari session kecuali dieksplisitkan. */
export async function audit(ctx: AuditContext): Promise<void> {
  const session = await auth().catch(() => null);
  const userId = ctx.userId ?? session?.user?.id ?? null;

  await db.auditLog.create({
    data: {
      userId,
      action: ctx.action,
      entity: ctx.entity,
      entityId: ctx.entityId ?? null,
      previousJson:
        ctx.previous === undefined ? undefined : (ctx.previous as Prisma.InputJsonValue),
      newJson: ctx.next === undefined ? undefined : (ctx.next as Prisma.InputJsonValue),
    },
  });
}

/** Bandingkan two record — hanya kembalikan field yang berubah (PRD §37). */
export function diffObjects<T extends Record<string, unknown>>(
  prev: T,
  next: Partial<T>,
): { previous: Partial<T>; next: Partial<T> } | null {
  const changed = Object.keys(next).filter((key) => {
    const a = prev[key as keyof T];
    const b = next[key as keyof T];
    return JSON.stringify(a ?? null) !== JSON.stringify(b ?? null);
  });

  if (changed.length === 0) return null;

  const previous: Partial<T> = {};
  const after: Partial<T> = {};
  for (const key of changed) {
    previous[key as keyof T] = prev[key as keyof T];
    after[key as keyof T] = next[key as keyof T];
  }
  return { previous, next: after };
}
