import { db } from "@/lib/db";
import { HotelForm } from "@/components/admin/hotel-form";

export const dynamic = "force-dynamic";

export default async function HotelSettingsPage() {
  const hotel = await db.hotel.findFirst();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Hotel Profile</h1>
        <p className="mt-0.5 text-sm text-ink-soft">
          Identitas hotel — dipakai di seluruh landing page
        </p>
      </div>
      {hotel ? (
        <HotelForm initial={hotel as unknown as Record<string, unknown>} />
      ) : (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Data hotel belum ada — jalankan <code>npx prisma db seed</code>.
        </p>
      )}
    </div>
  );
}
