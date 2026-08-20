import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { BookingListPage } from "@/components/admin/booking-list";

export const dynamic = "force-dynamic";

export default async function BookingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/admin/login");
  const isViewer = session.user.role === "VIEWER";

  return <BookingListPage isViewer={isViewer} />;
}