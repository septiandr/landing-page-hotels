import { GenericCrudForm } from "@/components/admin/generic-crud";
import { amenityConfig } from "@/components/admin/crud-configs";

export const dynamic = "force-dynamic";

export default function NewAmenityPage() {
  return <GenericCrudForm config={amenityConfig} mode="create" />;
}
