"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiPatch } from "./api";
import { Button, Card, FieldError, Label, StatusBadge, Textarea } from "./ui";
import { ConfirmDialog } from "./confirm-dialog";
import { useToast } from "./toast";
import { formatDate, formatCurrency } from "@/lib/format";

interface BookingDetail {
  id: string;
  code: string;
  status: string;
  guestName: string;
  guestPhone: string;
  guestEmail: string | null;
  guestIdNumber: string | null;
  checkIn: string;
  checkOut: string;
  nights: number;
  adults: number;
  kids: number;
  pricePerNight: unknown;
  totalPrice: unknown;
  currency: string;
  paymentMethod: string | null;
  cloudbedsReservationId: string | null;
  cancellationReason: string | null;
  notes: string | null;
  createdAt: string;
  roomType: { id: string; name: string; slug: string; currency: string };
  createdBy: { id: string; name: string; email: string } | null;
}

type Action = "CHECK_IN" | "CHECK_OUT" | "CANCEL" | "NO_SHOW";

const ACTION_LABELS: Record<Action, string> = {
  CHECK_IN: "Check-in",
  CHECK_OUT: "Check-out",
  CANCEL: "Cancel",
  NO_SHOW: "No Show",
};

/** Aksi yang tersedia per status (sinkron lib/booking-status.ts). */
const AVAILABLE_ACTIONS: Record<string, Action[]> = {
  CONFIRMED: ["CHECK_IN", "CANCEL", "NO_SHOW"],
  CHECKED_IN: ["CHECK_OUT", "CANCEL"],
  CHECKED_OUT: [],
  CANCELLED: [],
  NO_SHOW: [],
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-2.5">
      <dt className="shrink-0 text-sm text-ink-soft">{label}</dt>
      <dd className="text-right text-sm font-medium text-ink">{value}</dd>
    </div>
  );
}

export function BookingDetailPage({
  booking,
  isViewer,
}: {
  booking: BookingDetail;
  isViewer: boolean;
}) {
  const { toast } = useToast();
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<Action | null>(null);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");
  const [loading, setLoading] = useState(false);

  const actions = AVAILABLE_ACTIONS[booking.status] ?? [];

  async function confirmAction() {
    if (!pendingAction) return;
    if (pendingAction === "CANCEL" && !reason.trim()) {
      setReasonError("Alasan pembatalan wajib diisi");
      return;
    }
    setLoading(true);
    try {
      await apiPatch(`/api/admin/bookings/${booking.id}`, {
        action: pendingAction,
        cancellationReason: pendingAction === "CANCEL" ? reason.trim() : null,
      });
      toast("success", `Booking ${ACTION_LABELS[pendingAction].toLowerCase()} berhasil`);
      setPendingAction(null);
      setReason("");
      router.refresh();
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Gagal memproses aksi");
    } finally {
      setLoading(false);
    }
  }

  const currency = booking.currency || "IDR";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-semibold text-ink">{booking.code}</h1>
            <StatusBadge status={booking.status} />
          </div>
          <p className="mt-1 text-sm text-ink-soft">
            Booking walk-in · dibuat {formatDate(booking.createdAt, "dd MMM yyyy HH:mm")} oleh{" "}
            {booking.createdBy?.name ?? "—"}
          </p>
        </div>
        <Link
          href="/admin/bookings"
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-ink-soft transition hover:bg-surface"
        >
          ← Kembali
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Detail booking */}
        <Card className="p-5">
          <h2 className="font-semibold text-ink">Detail Booking</h2>
          <dl className="mt-2 divide-y divide-border">
            <InfoRow label="Tamu" value={booking.guestName} />
            <InfoRow label="No. HP" value={booking.guestPhone} />
            <InfoRow
              label="Email"
              value={booking.guestEmail ?? <span className="text-ink-soft">-</span>}
            />
            <InfoRow
              label="Identitas"
              value={booking.guestIdNumber ?? <span className="text-ink-soft">-</span>}
            />
            <InfoRow label="Kamar" value={booking.roomType.name} />
            <InfoRow
              label="Check-in → Out"
              value={`${formatDate(booking.checkIn, "dd MMM yyyy")} → ${formatDate(booking.checkOut, "dd MMM yyyy")} (${booking.nights} malam)`}
            />
            <InfoRow label="Tamu" value={`${booking.adults} dewasa · ${booking.kids} anak`} />
            <InfoRow
              label="Harga / malam"
              value={formatCurrency(Number(booking.pricePerNight), currency)}
            />
            <InfoRow label="Total" value={formatCurrency(Number(booking.totalPrice), currency)} />
            <InfoRow
              label="Pembayaran"
              value={booking.paymentMethod ?? <span className="text-ink-soft">-</span>}
            />
            <InfoRow
              label="Cloudbeds ID"
              value={
                booking.cloudbedsReservationId ?? <span className="text-ink-soft">-</span>
              }
            />
          </dl>
          {booking.notes ? (
            <p className="mt-4 rounded-lg bg-surface px-4 py-3 text-sm text-ink-soft">
              <span className="font-medium text-ink">Catatan: </span>
              {booking.notes}
            </p>
          ) : null}
          {booking.cancellationReason ? (
            <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-800">
              <span className="font-medium">Alasan batal: </span>
              {booking.cancellationReason}
            </p>
          ) : null}
        </Card>

        {/* Aksi front desk */}
        <Card className="p-5">
          <h2 className="font-semibold text-ink">Aksi Front Desk</h2>
          {isViewer ? (
            <p className="mt-3 text-sm text-ink-soft">
              Anda login sebagai Viewer — halaman ini read-only.
            </p>
          ) : actions.length === 0 ? (
            <p className="mt-3 text-sm text-ink-soft">
              Booking ini sudah terminal (selesai) — tidak ada aksi lanjutan.
            </p>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              {actions.map((a) => (
                <Button
                  key={a}
                  variant={a === "CANCEL" ? "danger" : a === "CHECK_IN" ? "primary" : "secondary"}
                  onClick={() => setPendingAction(a)}
                >
                  {ACTION_LABELS[a]}
                </Button>
              ))}
            </div>
          )}
        </Card>
      </div>

      <ConfirmDialog
        open={pendingAction !== null}
        title={pendingAction ? ACTION_LABELS[pendingAction] : ""}
        description={
          pendingAction === "CANCEL"
            ? "Pembatalan dicatat di audit log dengan alasan. Pastikan tamu sudah dihubungi."
            : pendingAction === "NO_SHOW"
              ? "Tandai tamu tidak datang pada tanggal check-in?"
              : pendingAction === "CHECK_IN"
                ? "Konfirmasi check-in tamu ini?"
                : "Konfirmasi check-out tamu ini?"
        }
        confirmLabel={pendingAction ? ACTION_LABELS[pendingAction] : ""}
        variant={pendingAction === "CANCEL" ? "danger" : "primary"}
        loading={loading}
        onConfirm={() => void confirmAction()}
        onCancel={() => {
          setPendingAction(null);
          setReason("");
          setReasonError("");
        }}
      >
        {pendingAction === "CANCEL" ? (
          <div>
            <Label htmlFor="cancel-reason">Alasan pembatalan</Label>
            <Textarea
              id="cancel-reason"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (reasonError) setReasonError("");
              }}
              placeholder="Mis. tamu batal, overbooking, dsb."
            />
            <FieldError message={reasonError} />
          </div>
        ) : null}
      </ConfirmDialog>
    </div>
  );
}