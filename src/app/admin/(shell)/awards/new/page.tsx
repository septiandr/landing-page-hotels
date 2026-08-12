import { GenericCrudForm } from "@/components/admin/generic-crud";

export const dynamic = "force-dynamic";

export default function NewAwardPage() {
  return <GenericCrudForm module="awards" mode="create" />;
}
