"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { KeyRound, Plus, Trash2, UserCheck, UserX } from "lucide-react";
import { createUserSchema, type UserInput } from "@/lib/validators";
import { ApiClientError, apiDelete, apiFetch, apiPatch, apiPost } from "./api";
import { Button, Card, FieldError, Input, Label, Select, Spinner, StatusBadge } from "./ui";
import { ConfirmDialog } from "./confirm-dialog";
import { useToast } from "./toast";
import { formatDate } from "@/lib/format";

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MARKETING" | "EDITOR" | "VIEWER";
  isActive: boolean;
  createdAt: string;
}

const ROLES = ["ADMIN", "MARKETING", "EDITOR", "VIEWER"] as const;

export function UsersManager() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<UserRow | null>(null);
  const [resetId, setResetId] = useState<UserRow | null>(null);
  const [resetPassword, setResetPassword] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<{ items: UserRow[] }>("/api/admin/users?limit=100");
      setUsers(data.items);
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Gagal memuat users");
    }
  }, [toast]);

  useEffect(() => {
    let cancelled = false;
    apiFetch<{ items: UserRow[] }>("/api/admin/users?limit=100")
      .then((data) => {
        if (!cancelled) setUsers(data.items);
      })
      .catch((err) => {
        if (!cancelled) toast("error", err instanceof Error ? err.message : "Gagal memuat users");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [toast]);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<UserInput>({
    resolver: standardSchemaResolver(createUserSchema) as Resolver<UserInput>,
    defaultValues: { role: "EDITOR", isActive: true, name: "", email: "", password: "" },
  });

  async function onCreate(values: UserInput) {
    try {
      await apiPost("/api/admin/users", values);
      toast("success", `User ${values.email} dibuat`);
      reset({ role: "EDITOR", isActive: true, name: "", email: "", password: "" });
      void load();
    } catch (err) {
      if (err instanceof ApiClientError && err.fields) {
        for (const [field, messages] of Object.entries(err.fields)) {
          setError(field as keyof UserInput, { message: messages[0] });
        }
      }
      toast("error", err instanceof Error ? err.message : "Gagal membuat user");
    }
  }

  async function patch(id: string, data: unknown, successMsg: string) {
    setSavingId(id);
    try {
      await apiPatch(`/api/admin/users/${id}`, data);
      toast("success", successMsg);
      void load();
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Gagal memperbarui user");
    } finally {
      setSavingId(null);
    }
  }

  async function onDelete() {
    if (!deleteId) return;
    setSavingId(deleteId.id);
    try {
      await apiDelete(`/api/admin/users/${deleteId.id}`);
      toast("success", `User ${deleteId.email} dihapus`);
      setDeleteId(null);
      void load();
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Gagal menghapus user");
    } finally {
      setSavingId(null);
    }
  }

  async function onResetPassword() {
    if (!resetId || resetPassword.length < 8) {
      toast("error", "Password minimal 8 karakter");
      return;
    }
    setSavingId(resetId.id);
    try {
      await apiPatch(`/api/admin/users/${resetId.id}`, { password: resetPassword });
      toast("success", `Password ${resetId.email} direset`);
      setResetId(null);
      setResetPassword("");
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Gagal reset password");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Form buat user */}
      <Card className="p-5">
        <h2 className="flex items-center gap-2 font-semibold text-ink">
          <Plus className="h-4 w-4 text-primary-700" /> Tambah User
        </h2>
        <form onSubmit={handleSubmit(onCreate)} noValidate className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <Label htmlFor="u-name">Nama *</Label>
            <Input id="u-name" {...register("name")} placeholder="Nama lengkap" />
            <FieldError message={errors.name?.message} />
          </div>
          <div>
            <Label htmlFor="u-email">Email *</Label>
            <Input id="u-email" type="email" {...register("email")} placeholder="nama@hotel.com" />
            <FieldError message={errors.email?.message} />
          </div>
          <div>
            <Label htmlFor="u-password">Password *</Label>
            <Input id="u-password" type="password" {...register("password")} placeholder="Min. 8 karakter" />
            <FieldError message={errors.password?.message} />
          </div>
          <div>
            <Label htmlFor="u-role">Role</Label>
            <Select id="u-role" {...register("role")}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex items-end">
            <Button type="submit" loading={isSubmitting} className="w-full">
              Buat User
            </Button>
          </div>
        </form>
      </Card>

      {/* Daftar user */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-10 text-ink-soft">
            <Spinner /> Memuat users…
          </div>
        ) : users.length === 0 ? (
          <p className="p-6 text-sm text-ink-soft">Belum ada user.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-surface">
              <tr className="text-xs uppercase tracking-wide text-ink-soft">
                <th className="px-4 py-3 font-semibold">Nama</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Dibuat</th>
                <th className="px-4 py-3 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user) => (
                <tr key={user.id} className={user.isActive ? "" : "opacity-60"}>
                  <td className="px-4 py-3 font-medium text-ink">{user.name}</td>
                  <td className="px-4 py-3 text-ink-soft">{user.email}</td>
                  <td className="px-4 py-3">
                    <Select
                      className="w-32 py-1 text-xs"
                      value={user.role}
                      disabled={savingId === user.id}
                      onChange={(e) => void patch(user.id, { role: e.target.value }, "Role diperbarui")}
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </Select>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={user.isActive ? "ACTIVE" : "DRAFT"} />
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-soft">
                    {formatDate(user.createdAt, "dd MMM yyyy")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      {user.isActive ? (
                        <button
                          type="button"
                          title="Nonaktifkan"
                          disabled={savingId === user.id}
                          onClick={() => void patch(user.id, { isActive: false }, "User dinonaktifkan")}
                          className="rounded-lg p-2 text-ink-soft transition hover:bg-amber-50 hover:text-amber-700 disabled:opacity-50"
                        >
                          <UserX className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          title="Aktifkan"
                          disabled={savingId === user.id}
                          onClick={() => void patch(user.id, { isActive: true }, "User diaktifkan")}
                          className="rounded-lg p-2 text-ink-soft transition hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-50"
                        >
                          <UserCheck className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        title="Reset password"
                        onClick={() => {
                          setResetId(user);
                          setResetPassword("");
                        }}
                        className="rounded-lg p-2 text-ink-soft transition hover:bg-primary-50 hover:text-primary-700"
                      >
                        <KeyRound className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        title="Hapus user"
                        onClick={() => setDeleteId(user)}
                        className="rounded-lg p-2 text-ink-soft transition hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Reset password dialog */}
      <ConfirmDialog
        open={resetId !== null}
        title={`Reset password — ${resetId?.email ?? ""}`}
        confirmLabel="Reset"
        variant="primary"
        loading={savingId !== null}
        onConfirm={() => void onResetPassword()}
        onCancel={() => setResetId(null)}
      >
        <Input
          type="password"
          placeholder="Password baru (min. 8 karakter)"
          value={resetPassword}
          onChange={(e) => setResetPassword(e.target.value)}
          autoFocus
        />
      </ConfirmDialog>

      {/* Delete confirm */}
      <ConfirmDialog
        open={deleteId !== null}
        title={`Hapus user ${deleteId?.email ?? ""}?`}
        description="Tindakan ini tidak bisa dibatalkan. User tidak bisa login lagi."
        confirmLabel="Hapus"
        variant="danger"
        loading={savingId !== null}
        onConfirm={() => void onDelete()}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
