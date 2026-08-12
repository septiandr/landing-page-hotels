import { GenericCrudPage } from "@/components/admin/generic-crud";

export const dynamic = "force-dynamic";

export default function TransportsPage() {
  return <GenericCrudPage module="transports" />;
}
