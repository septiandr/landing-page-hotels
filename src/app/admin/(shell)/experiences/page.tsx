import { GenericCrudPage } from "@/components/admin/generic-crud";
import { experienceConfig } from "@/components/admin/crud-configs";

export const dynamic = "force-dynamic";

export default function ExperiencesPage() {
  return <GenericCrudPage config={experienceConfig} />;
}
