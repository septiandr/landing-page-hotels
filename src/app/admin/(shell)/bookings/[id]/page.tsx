import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { requirePermissionWithRead } from "@/lib/require";
import { BookingDetailPage } from "@/components/admin/booking-detail";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function BookingDetail({ params }: { params: Params }) {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");

  try {
    await requirePermissionWithRead("onsite_booking");
  } catch {
    redirect("/admin/bookings");
  }

  const { id } = await params;
  const booking = await db.booking.findUnique({
    where: { id },
    include: {
      roomType: { select: { id: true, name: true, slug: true, currency: true } },
      createdBy: { select: { id: true, name: true, email: true } },
    },
  });
  if (!booking) notFound();

  const serialized = {
    ...booking,
    checkIn: booking.checkIn.toISOString(),
    checkOut: booking.checkOut.toISOString(),
    createdAt: booking.createdAt.toISOString(),
    pricePerNight: Number(booking.pricePerNight),
    totalPrice: Number(booking.totalPrice),
  };

  const isViewer = session.user.role === "VIEWER";
  return <BookingDetailPage booking={serialized} isViewer={isViewer} />;
}