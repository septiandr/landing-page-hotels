import { GenericCrudForm } from "@/components/admin/generic-crud";

export const dynamic = "force-dynamic";

export default function NewTestimonialPage() {
  return <GenericCrudForm module="testimonials" mode="create" />;
}
