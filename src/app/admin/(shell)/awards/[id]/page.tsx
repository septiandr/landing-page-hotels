import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { GenericCrudForm } from "@/components/admin/generic-crud";

export const dynamic = "force-dynamic";

export default async function EditAwardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await db.award.findUnique({ where: { id } });
  if (!item) notFound();
  return (
    <GenericCrudForm
      module="awards"
      mode="edit"
      id={id}
      initial={item as unknown as Record<string, unknown>}
    />
  );
}
