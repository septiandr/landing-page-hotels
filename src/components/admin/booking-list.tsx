"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { BOOKING_STATUSES } from "@/lib/validators";
import { apiFetch } from "./api";
import { Button, Card, EmptyState, Input, Select, Skeleton, StatusBadge } from "./ui";
import { useToast } from "./toast";
import { formatDate } from "@/lib/format";

interface BookingRow {
  id: string;
  code: string;
  guestName: string;
  guestPhone: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  totalPrice: unknown;
  currency: string;
  status: string;
  roomType: { id: string; name: string; slug: string; currency: string };
}

interface ListData {
  items: BookingRow[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export function BookingListPage({ isViewer }: { isViewer: boolean }) {
  const { toast } = useToast();
  const [data, setData] = useState<ListData | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [date, setDate] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (q) params.set("q", q);
      if (status) params.set("status", status);
      if (date) params.set("date", date);
      const d = await apiFetch<ListData>(`/api/admin/bookings?${params.toString()}`);
      setData(d);
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Gagal memuat booking");
    }
  }, [q, status, date, page, toast]);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    if (date) params.set("date", date);
    apiFetch<ListData>(`/api/admin/bookings?${params.toString()}`)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((err) => {
        if (!cancelled) toast("error", err instanceof Error ? err.message : "Gagal memuat booking");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [q, status, date, page, toast]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Bookings</h1>
          <p className="mt-0.5 text-sm text-ink-soft">
            {data ? `${data.pagination.total} booking · kelola reservasi tamu` : "Kelola reservasi tamu"}
          </p>
        </div>
        {!isViewer ? (
          <Link
            href="/admin/bookings/new"
            className="inline-flex items-center gap-2 rounded-lg bg-primary-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-primary-800"
          >
            <Plus className="h-4 w-4" /> New Booking
          </Link>
        ) : null}
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
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari nama / no. HP / kode…"
              className="w-60 pl-9"
              aria-label="Cari booking"
            />
          </div>
          <Button type="submit" variant="secondary">Cari</Button>
        </form>
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
          {BOOKING_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>
        <Input
          type="date"
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            setPage(1);
          }}
          className="w-44"
          aria-label="Filter tanggal check-in"
        />
      </div>

      <Card className="overflow-hidden">
        {loading || !data ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : data.items.length === 0 ? (
          <EmptyState title="Belum ada booking" description="Coba ubah filter atau buat booking baru." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-ink-soft">
                  <th className="px-4 py-3 font-medium">Kode</th>
                  <th className="px-4 py-3 font-medium">Tamu</th>
                  <th className="px-4 py-3 font-medium">Kamar</th>
                  <th className="px-4 py-3 font-medium">Check-in → Out</th>
                  <th className="px-4 py-3 font-medium">Malam</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.items.map((b) => (
                  <tr key={b.id} className="transition hover:bg-surface">
                    <td className="px-4 py-3 font-mono text-xs text-ink-soft">{b.code}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink">{b.guestName}</p>
                      <p className="text-xs text-ink-soft">{b.guestPhone}</p>
                    </td>
                    <td className="px-4 py-3">{b.roomType?.name ?? "-"}</td>
                    <td className="px-4 py-3 text-xs text-ink-soft">
                      {formatDate(b.checkIn, "dd MMM")} → {formatDate(b.checkOut, "dd MMM yyyy")}
                    </td>
                    <td className="px-4 py-3">{b.nights}</td>
                    <td className="px-4 py-3">
                      {new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: b.currency || "IDR",
                        maximumFractionDigits: 0,
                      }).format(Number(b.totalPrice))}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/bookings/${b.id}`}
                        className="inline-flex rounded-lg px-3 py-1.5 text-sm font-medium text-primary-700 transition hover:bg-primary-50"
                      >
                        Detail →
                      </Link>
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
    </div>
  );
}