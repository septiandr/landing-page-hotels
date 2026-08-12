import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { GenericCrudForm } from "@/components/admin/generic-crud";
import { faqConfig } from "@/components/admin/crud-configs";

export const dynamic = "force-dynamic";

export default async function EditFaqPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await db.faqItem.findUnique({ where: { id } });
  if (!item) notFound();
  return (
    <GenericCrudForm config={faqConfig} mode="edit" id={id} initial={item as unknown as Record<string, unknown>} />
  );
}
