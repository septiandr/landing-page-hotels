"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Pencil, Plus, Trash2 } from "lucide-react";
import { PROMOTION_STATUSES } from "@/lib/validators";
import { apiDelete, apiFetch } from "./api";
import { Button, Card, EmptyState, Select, Skeleton, StatusBadge } from "./ui";
import { ConfirmDialog } from "./confirm-dialog";
import { useToast } from "./toast";

interface PromoRow {
  id: string;
  title: string;
  discountLabel: string | null;
  promoCode: string | null;
  status: string;
  bookingEnd: string | null;
  showCountdown: boolean;
}

interface ListData {
  items: PromoRow[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export function PromotionListPage() {
  const { toast } = useToast();
  const [data, setData] = useState<ListData | null>(null);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<PromoRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (status) params.set("status", status);
      const d = await apiFetch<ListData>(`/api/admin/promotions?${params.toString()}`);
      setData(d);
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Gagal memuat promosi");
    }
  }, [status, page, toast]);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (status) params.set("status", status);
    apiFetch<ListData>(`/api/admin/promotions?${params.toString()}`)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((err) => {
        if (!cancelled) toast("error", err instanceof Error ? err.message : "Gagal memuat promosi");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [status, page, toast]);

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await apiDelete(`/api/admin/promotions/${deleting.id}`);
      toast("success", "Promosi dihapus");
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
          <h1 className="font-display text-2xl font-semibold text-ink">Promotions</h1>
          <p className="mt-0.5 text-sm text-ink-soft">
            {data ? `${data.pagination.total} promosi · status otomatis dari periode booking` : "Kelola promosi"}
          </p>
        </div>
        <Link
          href="/admin/promotions/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-primary-800"
        >
          <Plus className="h-4 w-4" /> Tambah Promosi
        </Link>
      </div>

      <Select
        value={status}
        onChange={(e) => {
          setStatus(e.target.value);
          setPage(1);
        }}
        className="w-44"
        aria-label="Filter status"
      >
        <option value="">Semua Status</option>
        {PROMOTION_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </Select>

      {loading || !data ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : data.items.length === 0 ? (
        <EmptyState title="Belum ada promosi" description="Buat promosi pertama untuk menarik booking langsung." />
      ) : (
        <div className="space-y-3">
          {data.items.map((promo) => {
            const warning = promo.showCountdown && !promo.bookingEnd;
            return (
              <Card key={promo.id} className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-medium text-ink">{promo.title}</h2>
                      {promo.discountLabel ? (
                        <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-semibold text-primary-800">
                          {promo.discountLabel}
                        </span>
                      ) : null}
                      {promo.promoCode ? (
                        <span className="rounded-full bg-ink/5 px-2 py-0.5 font-mono text-xs text-ink-soft">
                          {promo.promoCode}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-ink-soft">
                      {promo.bookingEnd
                        ? `Booking hingga ${new Date(promo.bookingEnd).toLocaleString("id-ID")}`
                        : "Tanpa periode booking"}
                      {promo.showCountdown ? " · countdown aktif" : ""}
                    </p>
                    {warning ? (
                      <p className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-700">
                        <AlertTriangle className="h-3.5 w-3.5" /> Countdown tanpa deadline — atur bookingEnd
                      </p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={promo.status} />
                    <Link
                      href={`/admin/promotions/${promo.id}`}
                      aria-label={`Edit ${promo.title}`}
                      className="rounded-lg p-2 text-ink-soft transition hover:bg-ink/5 hover:text-ink"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                    <button
                      type="button"
                      aria-label={`Hapus ${promo.title}`}
                      onClick={() => setDeleting(promo)}
                      className="rounded-lg p-2 text-ink-soft transition hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {data && data.pagination.totalPages > 1 ? (
        <div className="flex items-center justify-between text-sm text-ink-soft">
          <span>
            Halaman {data.pagination.page} dari {data.pagination.totalPages}
          </span>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Sebelumnya
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= data.pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Berikutnya
            </Button>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={deleting !== null}
        title="Hapus promosi ini?"
        description={`"${deleting?.title ?? ""}" akan dihapus permanen.`}
        loading={deleteLoading}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
