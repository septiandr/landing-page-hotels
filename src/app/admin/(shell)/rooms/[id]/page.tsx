import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { RoomForm } from "@/components/admin/room-form";

export const dynamic = "force-dynamic";

export default async function EditRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const room = await db.room.findUnique({
    where: { id },
    include: { photos: { orderBy: { sortOrder: "asc" } }, amenities: true },
  });
  if (!room) notFound();
  return <RoomForm mode="edit" id={id} initial={room as unknown as Record<string, unknown>} />;
}
