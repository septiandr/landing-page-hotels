import { requirePermission } from "@/lib/require";
import { UsersManager } from "@/components/admin/users-manager";
import { Card } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  try {
    await requirePermission("users");
  } catch {
    return (
      <Card className="p-6">
        <p className="font-medium text-ink">Akses ditolak</p>
        <p className="mt-1 text-sm text-ink-soft">Hanya role ADMIN yang dapat mengelola user.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Manajemen User</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Buat user, atur role, aktif/nonaktif, reset password (PRD §36).
        </p>
      </div>
      <UsersManager />
    </div>
  );
}
