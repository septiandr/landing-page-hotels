import { GenericCrudForm } from "@/components/admin/generic-crud";
import { attractionConfig } from "@/components/admin/crud-configs";

export const dynamic = "force-dynamic";

export default function NewAttractionPage() {
  return <GenericCrudForm config={attractionConfig} mode="create" />;
}
