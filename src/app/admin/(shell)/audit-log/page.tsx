import Link from "next/link";
import { db } from "@/lib/db";
import { diffObjects } from "@/lib/audit";
import { requirePermission } from "@/lib/require";
import { Card, StatusBadge } from "@/components/admin/ui";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

const ACTIONS = [
  "CREATE",
  "UPDATE",
  "DELETE",
  "PUBLISH",
  "UNPUBLISH",
  "CHECK_IN",
  "CHECK_OUT",
  "CANCEL",
  "LOGIN",
  "LOGIN_FAILED",
] as const;

const ENTITY_LABELS: Record<string, string> = {
  Room: "Kamar",
  GalleryItem: "Gallery",
  Promotion: "Promosi",
  Testimonial: "Testimoni",
  Experience: "Experience",
  Attraction: "Wisata",
  FaqItem: "FAQ",
  Amenity: "Fasilitas",
  Hotel: "Hotel",
  SeoMeta: "SEO",
  User: "Pengguna",
  Booking: "Booking",
};

type Params = Promise<{ entity?: string; action?: string; page?: string }>;

export default async function AuditLogPage({ searchParams }: { searchParams: Params }) {
  const { entity, action, page: pageRaw } = await searchParams;
  const page = Math.max(1, Number(pageRaw) || 1);
  const limit = 25;

  const where: Record<string, string> = {};
  if (entity) where.entity = entity;
  if (action) where.action = action;

  // Halaman ini hanya untuk ADMIN & MARKETING (permission analytics).
  try {
    await requirePermission("analytics");
  } catch {
    return (
      <Card className="p-6">
        <p className="font-medium text-ink">Akses ditolak</p>
        <p className="mt-1 text-sm text-ink-soft">
          Hanya ADMIN & MARKETING yang dapat melihat audit log.
        </p>
      </Card>
    );
  }

  const [logs, total, entities] = await Promise.all([
    db.auditLog.findMany({
      where,
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.auditLog.count({ where }),
    db.auditLog.findMany({ distinct: ["entity"], select: { entity: true } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const qs = (extra: Record<string, string>) =>
    new URLSearchParams({
      ...(entity ? { entity } : {}),
      ...(action ? { action } : {}),
      ...extra,
    }).toString();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Audit Log</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Jejak perubahan konten & aktivitas admin (PRD §37) — diff memperlihatkan nilai sebelum →
          sesudah.
        </p>
      </div>

      {/* Filter */}
      <Card className="p-4">
        <form method="get" className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-sm font-medium text-ink">
            Entity
            <select
              name="entity"
              className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm outline-none focus:border-primary-500"
            >
              <option value="">Semua</option>
              {entities.map((e) => (
                <option key={e.entity} value={e.entity} selected={entity === e.entity}>
                  {ENTITY_LABELS[e.entity] ?? e.entity}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-ink">
            Aksi
            <select
              name="action"
              className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm outline-none focus:border-primary-500"
            >
              <option value="">Semua</option>
              {ACTIONS.map((a) => (
                <option key={a} value={a} selected={action === a}>
                  {a}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="rounded-lg bg-primary-700 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-primary-800"
          >
            Filter
          </button>
          {(entity || action) && (
            <Link
              href="/admin/audit-log"
              className="rounded-lg border border-border px-4 py-1.5 text-sm font-medium text-ink-soft transition hover:bg-surface"
            >
              Reset
            </Link>
          )}
        </form>
      </Card>

      {/* Tabel */}
      <Card className="overflow-hidden">
        {logs.length === 0 ? (
          <p className="p-6 text-sm text-ink-soft">Belum ada catatan audit.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface">
              <tr className="text-xs uppercase tracking-wide text-ink-soft">
                <th className="px-4 py-3 font-semibold">Waktu</th>
                <th className="px-4 py-3 font-semibold">User</th>
                <th className="px-4 py-3 font-semibold">Aksi</th>
                <th className="px-4 py-3 font-semibold">Entity</th>
                <th className="px-4 py-3 font-semibold">Perubahan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.map((log) => (
                <AuditRow key={log.id} log={log} />
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm">
        <p className="text-ink-soft">
          Halaman {page} dari {totalPages} · {total} catatan
        </p>
        <div className="flex gap-2">
          {page > 1 && (
            <Link
              href={`/admin/audit-log?${qs({ page: String(page - 1) })}`}
              className="rounded-lg border border-border px-3 py-1.5 font-medium text-ink-soft transition hover:bg-surface"
            >
              ← Sebelumnya
            </Link>
          )}
          {page < totalPages && (
            <Link
              href={`/admin/audit-log?${qs({ page: String(page + 1) })}`}
              className="rounded-lg border border-border px-3 py-1.5 font-medium text-ink-soft transition hover:bg-surface"
            >
              Berikutnya →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Row + diff rendering ---------- */

type AuditLogRow = {
  id: string;
  createdAt: Date;
  action: string;
  entity: string;
  entityId: string | null;
  previousJson: unknown;
  newJson: unknown;
  user: { name: string | null; email: string | null } | null;
};

function AuditRow({ log }: { log: AuditLogRow }) {
  // Reuse diffObjects (lib/audit) — hanya field yang berubah, format sama dengan backend.
  const prev = asRecord(log.previousJson);
  const next = asRecord(log.newJson);
  const diff = prev && next ? diffObjects(prev, next) : null;
  const diffKeys = diff ? Object.keys(diff.previous) : [];

  const summary =
    log.action === "UPDATE" && diffKeys.length > 0
      ? `${diffKeys.length} field berubah`
      : "—";

  return (
    <tr className="align-top hover:bg-surface/60">
      <td className="whitespace-nowrap px-4 py-3 text-ink-soft">
        {formatDate(log.createdAt, "dd MMM yyyy HH:mm")}
      </td>
      <td className="px-4 py-3">
        <p className="font-medium text-ink">{log.user?.name ?? "Sistem"}</p>
        {log.user ? <p className="text-xs text-ink-soft">{log.user.email}</p> : null}
      </td>
      <td className="px-4 py-3">
        <StatusBadge status={log.action} />
      </td>
      <td className="px-4 py-3 text-ink-soft">
        {ENTITY_LABELS[log.entity] ?? log.entity}
        {log.entityId ? <span className="block text-xs">{log.entityId.slice(0, 8)}…</span> : null}
      </td>
      <td className="px-4 py-3">
        {log.action === "UPDATE" && diffKeys.length > 0 ? (
          <details className="group">
            <summary className="cursor-pointer font-medium text-primary-700 hover:underline">
              {summary} — lihat diff
            </summary>
            <div className="mt-2 space-y-1.5 rounded-lg bg-surface p-3">
              {diffKeys.map((key) => (
                <DiffRow
                  key={key}
                  keyName={key}
                  prev={diff?.previous[key]}
                  next={diff?.next[key]}
                />
              ))}
            </div>
          </details>
        ) : (
          <span className="text-ink-soft">{summary}</span>
        )}
      </td>
    </tr>
  );
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function DiffRow({ keyName, prev, next }: { keyName: string; prev: unknown; next: unknown }) {
  const display = (value: unknown): string => {
    if (value === null || value === undefined) return "—";
    if (typeof value === "object") {
      const size = Array.isArray(value) ? value.length : Object.keys(value as object).length;
      return `{${size} item}`;
    }
    const str = String(value);
    return str.length > 80 ? `${str.slice(0, 77)}…` : str;
  };

  return (
    <div className="text-xs">
      <span className="font-semibold text-ink">{keyName}</span>
      <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="text-red-600 line-through decoration-red-300">{display(prev)}</span>
        <span aria-hidden className="text-ink-soft">→</span>
        <span className="font-medium text-emerald-700">{display(next)}</span>
      </div>
    </div>
  );
}
