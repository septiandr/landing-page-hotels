import { GenericCrudPage } from "@/components/admin/generic-crud";
import { faqConfig } from "@/components/admin/crud-configs";

export const dynamic = "force-dynamic";

export default function FaqsPage() {
  return <GenericCrudPage config={faqConfig} />;
}
