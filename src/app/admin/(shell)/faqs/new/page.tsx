import { GenericCrudForm } from "@/components/admin/generic-crud";

export const dynamic = "force-dynamic";

export default function NewFaqPage() {
  return <GenericCrudForm module="faqs" mode="create" />;
}
