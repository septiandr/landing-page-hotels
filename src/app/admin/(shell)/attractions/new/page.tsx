import { GenericCrudForm } from "@/components/admin/generic-crud";

export const dynamic = "force-dynamic";

export default function NewAttractionPage() {
  return <GenericCrudForm module="attractions" mode="create" />;
}
