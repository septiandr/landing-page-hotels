import { GenericCrudPage } from "@/components/admin/generic-crud";
import { amenityConfig } from "@/components/admin/crud-configs";

export const dynamic = "force-dynamic";

export default function AmenitiesPage() {
  return <GenericCrudPage config={amenityConfig} />;
}
