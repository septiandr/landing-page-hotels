import { GenericCrudForm } from "@/components/admin/generic-crud";
import { experienceConfig } from "@/components/admin/crud-configs";

export const dynamic = "force-dynamic";

export default function NewExperiencePage() {
  return <GenericCrudForm config={experienceConfig} mode="create" />;
}
