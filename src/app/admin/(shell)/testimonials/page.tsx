import { GenericCrudPage } from "@/components/admin/generic-crud";
import { testimonialConfig } from "@/components/admin/crud-configs";

export const dynamic = "force-dynamic";

export default function TestimonialsPage() {
  return <GenericCrudPage config={testimonialConfig} />;
}
