import { GenericCrudForm } from "@/components/admin/generic-crud";
import { testimonialConfig } from "@/components/admin/crud-configs";

export const dynamic = "force-dynamic";

export default function NewTestimonialPage() {
  return <GenericCrudForm config={testimonialConfig} mode="create" />;
}
