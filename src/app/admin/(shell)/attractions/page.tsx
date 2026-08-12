import { GenericCrudPage } from "@/components/admin/generic-crud";
import { attractionConfig } from "@/components/admin/crud-configs";

export const dynamic = "force-dynamic";

export default function AttractionsPage() {
  return <GenericCrudPage config={attractionConfig} />;
}
