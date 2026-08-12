import { GenericCrudForm } from "@/components/admin/generic-crud";
import { faqConfig } from "@/components/admin/crud-configs";

export const dynamic = "force-dynamic";

export default function NewFaqPage() {
  return <GenericCrudForm config={faqConfig} mode="create" />;
}
