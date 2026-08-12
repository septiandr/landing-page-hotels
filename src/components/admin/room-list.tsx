"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { CONTENT_STATUSES } from "@/lib/validators";
import { apiDelete, apiFetch } from "./api";
import { Button, Card, EmptyState, Input, Select, Skeleton, StatusBadge } from "./ui";
import { ConfirmDialog } from "./confirm-dialog";
import { MoneyCell } from "./generic-crud";
import { useToast } from "./toast";

interface RoomRow {
  id: string;
  slug: string;
  name: string;
  priceFrom: unknown;
  status: string;
  photos: { url: string; altText: string }[];
  updatedAt: string;
}

interface ListData {
  items: RoomRow[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export function RoomListPage() {
  const { toast } = useToast();
  const [data, setData] = useState<ListData | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<RoomRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (q) params.set("q", q);
      if (status) params.set("status", status);
      const d = await apiFetch<ListData>(`/api/admin/rooms?${params.toString()}`);
      setData(d);
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Gagal memuat rooms");
    }
  }, [q, status, page, toast]);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    apiFetch<ListData>(`/api/admin/rooms?${params.toString()}`)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((err) => {
        if (!cancelled) toast("error", err instanceof Error ? err.message : "Gagal memuat rooms");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [q, status, page, toast]);

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await apiDelete(`/api/admin/rooms/${deleting.id}`);
      toast("success", "Room dihapus");
      setDeleting(null);
      void load();
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Gagal menghapus");
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Rooms</h1>
          <p className="mt-0.5 text-sm text-ink-soft">
            {data ? `${data.pagination.total} kamar · kelola tipe kamar & harga` : "Kelola tipe kamar"}
          </p>
        </div>
        <Link
          href="/admin/rooms/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-primary-800"
        >
          <Plus className="h-4 w-4" /> Tambah Room
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            void load();
          }}
        >
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari nama / slug…" className="w-56 pl-9" aria-label="Cari" />
          </div>
          <Button type="submit" variant="secondary">Cari</Button>
        </form>
        <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="w-44" aria-label="Filter status">
          <option value="">Semua Status</option>
          {CONTENT_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>
      </div>

      <Card className="overflow-hidden">
        {loading || !data ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : data.items.length === 0 ? (
          <EmptyState title="Belum ada room" description="Klik Tambah Room untuk membuat tipe kamar pertama." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-ink-soft">
                  <th className="px-4 py-3 font-medium">Kamar</th>
                  <th className="px-4 py-3 font-medium">Slug</th>
                  <th className="px-4 py-3 font-medium">Harga</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Update</th>
                  <th className="px-4 py-3 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.items.map((room) => (
                  <tr key={room.id} className="transition hover:bg-surface">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={room.photos[0]?.url ?? ""}
                          alt={room.photos[0]?.altText ?? room.name}
                          className="h-10 w-14 shrink-0 rounded-md object-cover"
                          loading="lazy"
                        />
                        <span className="font-medium text-ink">{room.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-ink-soft">{room.slug}</td>
                    <td className="px-4 py-3"><MoneyCell value={room.priceFrom} /></td>
                    <td className="px-4 py-3"><StatusBadge status={room.status} /></td>
                    <td className="px-4 py-3 text-xs text-ink-soft">
                      {new Date(room.updatedAt).toLocaleDateString("id-ID")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Link
                          href={`/admin/rooms/${room.id}`}
                          aria-label={`Edit ${room.name}`}
                          className="rounded-lg p-2 text-ink-soft transition hover:bg-ink/5 hover:text-ink"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          aria-label={`Hapus ${room.name}`}
                          onClick={() => setDeleting(room)}
                          className="rounded-lg p-2 text-ink-soft transition hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {data && data.pagination.totalPages > 1 ? (
        <div className="flex items-center justify-between text-sm text-ink-soft">
          <span>Halaman {data.pagination.page} dari {data.pagination.totalPages} ({data.pagination.total} item)</span>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Sebelumnya
            </Button>
            <Button variant="secondary" size="sm" disabled={page >= data.pagination.totalPages} onClick={() => setPage((p) => p + 1)}>
              Berikutnya
            </Button>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={deleting !== null}
        title="Hapus room ini?"
        description={`"${deleting?.name ?? ""}" beserta foto & fasilitasnya akan dihapus permanen.`}
        loading={deleteLoading}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
