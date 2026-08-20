import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/require";
import { BookingForm } from "@/components/admin/booking-form";
import { Card } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function NewBookingPage() {
  try {
    await requirePermission("onsite_booking");
  } catch {
    redirect("/admin/bookings");
  }

  const rooms = await db.room.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, slug: true, priceFrom: true, currency: true },
  });

  const roomOptions = rooms.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    priceFrom: r.priceFrom == null ? null : Number(r.priceFrom),
    currency: r.currency,
  }));

  if (rooms.length === 0) {
    return (
      <Card className="p-6">
        <p className="font-medium text-ink">Belum ada tipe kamar published</p>
        <p className="mt-1 text-sm text-ink-soft">
          Buat & publish room di menu Rooms sebelum membuat booking walk-in.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">New Walk-in Booking</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Booking tamu langsung di tempat (front desk) — tercatat di CMS & di-sync ke Cloudbeds.
        </p>
      </div>
      <BookingForm rooms={roomOptions} />
    </div>
  );
}