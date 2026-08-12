import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { GenericCrudForm } from "@/components/admin/generic-crud";
import { amenityConfig } from "@/components/admin/crud-configs";

export const dynamic = "force-dynamic";

export default async function EditAmenityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await db.amenity.findUnique({ where: { id } });
  if (!item) notFound();
  return (
    <GenericCrudForm config={amenityConfig} mode="edit" id={id} initial={item as unknown as Record<string, unknown>} />
  );
}
