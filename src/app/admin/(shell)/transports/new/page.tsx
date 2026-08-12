import { GenericCrudForm } from "@/components/admin/generic-crud";

export const dynamic = "force-dynamic";

export default function NewTransportPage() {
  return <GenericCrudForm module="transports" mode="create" />;
}
