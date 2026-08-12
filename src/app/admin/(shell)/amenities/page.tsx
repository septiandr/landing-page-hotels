import { GenericCrudPage } from "@/components/admin/generic-crud";

export const dynamic = "force-dynamic";

export default function AmenitiesPage() {
  return <GenericCrudPage module="amenities" />;
}
