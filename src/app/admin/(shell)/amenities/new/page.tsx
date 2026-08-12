import { GenericCrudForm } from "@/components/admin/generic-crud";

export const dynamic = "force-dynamic";

export default function NewAmenityPage() {
  return <GenericCrudForm module="amenities" mode="create" />;
}
