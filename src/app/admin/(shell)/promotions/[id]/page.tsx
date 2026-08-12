import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PromotionForm } from "@/components/admin/promotion-form";

export const dynamic = "force-dynamic";

export default async function EditPromotionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const promo = await db.promotion.findUnique({ where: { id } });
  if (!promo) notFound();
  return <PromotionForm mode="edit" id={id} initial={promo as unknown as Record<string, unknown>} />;
}
