import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { GenericCrudForm } from "@/components/admin/generic-crud";

export const dynamic = "force-dynamic";

export default async function EditTestimonialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await db.testimonial.findUnique({ where: { id } });
  if (!item) notFound();
  return (
    <GenericCrudForm
      module="testimonials"
      mode="edit"
      id={id}
      initial={item as unknown as Record<string, unknown>}
    />
  );
}
