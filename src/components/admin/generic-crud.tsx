"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import {
  ApiClientError,
  apiDelete,
  apiFetch,
  apiPatch,
  apiPost,
} from "./api";
import { Button, Card, EmptyState, FieldError, Input, Label, Select, Skeleton, StatusBadge, Textarea } from "./ui";
import { ConfirmDialog } from "./confirm-dialog";
import { ImageUploader } from "./image-uploader";
import { useToast } from "./toast";
import type { CrudField, CrudModuleConfig } from "./crud-config";

type Row = Record<string, unknown>;

/* ============================ LIST ============================ */

export function GenericCrudPage({ config }: { config: CrudModuleConfig }) {
  const { toast } = useToast();
  const [items, setItems] = useState<Row[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<Row | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page: String(pagination.page), limit: "20" });
      if (q) params.set("q", q);
      if (filter && config.filter) params.set(config.filter.param, filter);
      const data = await apiFetch<{ items: Row[]; pagination: typeof pagination }>(
        `${config.apiPath}?${params.toString()}`,
      );
      setItems(data.items);
      setPagination(data.pagination);
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Gagal memuat data");
    }
  }, [config, q, filter, pagination.page, toast]);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ page: String(pagination.page), limit: "20" });
    if (q) params.set("q", q);
    if (filter && config.filter) params.set(config.filter.param, filter);
    apiFetch<{ items: Row[]; pagination: typeof pagination }>(`${config.apiPath}?${params.toString()}`)
      .then((data) => {
        if (cancelled) return;
        setItems(data.items);
        setPagination(data.pagination);
      })
      .catch((err) => {
        if (!cancelled) toast("error", err instanceof Error ? err.message : "Gagal memuat data");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [config, q, filter, pagination.page, toast]);

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await apiDelete(`${config.apiPath}/${String(deleting.id)}`);
      toast("success", `${config.entityLabel} dihapus`);
      setDeleting(null);
      void load();
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Gagal menghapus");
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">{config.title}</h1>
          <p className="mt-0.5 text-sm text-ink-soft">
            {pagination.total} item · kelola konten hotel
          </p>
        </div>
        <Link
          href={`${config.pagePath}/new`}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-primary-800"
        >
          <Plus className="h-4 w-4" /> Tambah {config.entityLabel}
        </Link>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setPagination((p) => ({ ...p, page: 1 }));
            void load();
          }}
        >
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-soft" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari…"
              className="w-56 pl-9"
              aria-label="Cari"
            />
          </div>
          <Button type="submit" variant="secondary">
            Cari
          </Button>
        </form>
        {config.filter ? (
          <Select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            className="w-44"
            aria-label={`Filter ${config.filter.label}`}
          >
            <option value="">Semua {config.filter.label}</option>
            {config.filter.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        ) : null}
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title={`Belum ada ${config.entityLabel.toLowerCase()}`}
            description="Klik tombol Tambah untuk membuat data pertama."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-ink-soft">
                  {config.columns.map((col) => (
                    <th key={col.key} className="px-4 py-3 font-medium">
                      {col.label}
                    </th>
                  ))}
                  {config.statusField ? (
                    <th className="px-4 py-3 font-medium">Status</th>
                  ) : null}
                  <th className="px-4 py-3 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((row) => (
                  <tr key={String(row.id)} className="transition hover:bg-surface">
                    {config.columns.map((col) => (
                      <td key={col.key} className="max-w-64 truncate px-4 py-3 text-ink">
                        {col.render ? col.render(row) : String(row[col.key] ?? "-")}
                      </td>
                    ))}
                    {config.statusField ? (
                      <td className="px-4 py-3">
                        <StatusBadge status={String(row[config.statusField] ?? "-")} />
                      </td>
                    ) : null}
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Link
                          href={`${config.pagePath}/${String(row.id)}`}
                          aria-label={`Edit ${String(row[config.columns[0]?.key] ?? "")}`}
                          className="rounded-lg p-2 text-ink-soft transition hover:bg-ink/5 hover:text-ink"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          aria-label="Hapus"
                          onClick={() => setDeleting(row)}
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
          </div>
        )}
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 ? (
        <div className="flex items-center justify-between text-sm text-ink-soft">
          <span>
            Halaman {pagination.page} dari {pagination.totalPages} ({pagination.total} item)
          </span>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
            >
              Sebelumnya
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
            >
              Berikutnya
            </Button>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={deleting !== null}
        title={`Hapus ${config.entityLabel.toLowerCase()}?`}
        description="Tindakan ini tidak bisa dibatalkan."
        loading={deleteLoading}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}

/* ============================ FORM ============================ */

interface GenericCrudFormProps {
  config: CrudModuleConfig;
  mode: "create" | "edit";
  initial?: Row;
  id?: string;
}

function buildDefaults(config: CrudModuleConfig, initial?: Row): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const field of config.fields) {
    if (field.showInForm === false) continue;
    out[field.name] = initial?.[field.name] ?? (field.type === "checkbox" ? false : "");
  }
  return out;
}

function buildPayload(config: CrudModuleConfig, values: Record<string, unknown>): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const field of config.fields) {
    if (field.showInForm === false) continue;
    const v = values[field.name];
    if ((field.type === "number" || field.type === "date" || field.type === "datetime") && (v === "" || v == null)) {
      payload[field.name] = null;
    } else {
      payload[field.name] = v;
    }
  }
  return payload;
}

export function GenericCrudForm({ config, mode, initial, id }: GenericCrudFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const schema = mode === "create" ? config.createSchema : config.updateSchema;
  const defaultValues = useMemo(() => buildDefaults(config, initial), [config, initial]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    setError,
    watch,
  } = useForm<Record<string, unknown>>({
    // Schema dari config bertipe loose (z.ZodType) — resolver tetap valid di runtime
    // karena semua schema module ini adalah Zod object.
    resolver: standardSchemaResolver(
      schema as unknown as Parameters<typeof standardSchemaResolver>[0],
    ) as Resolver<Record<string, unknown>>,
    defaultValues,
  });

  async function onSubmit(values: Record<string, unknown>) {
    const payload = buildPayload(config, values);
    try {
      if (mode === "create") {
        await apiPost(config.apiPath, payload);
        toast("success", `${config.entityLabel} berhasil dibuat`);
      } else {
        await apiPatch(`${config.apiPath}/${id}`, payload);
        toast("success", `${config.entityLabel} berhasil diperbarui`);
      }
      router.push(config.pagePath);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiClientError && err.fields) {
        for (const [field, messages] of Object.entries(err.fields)) {
          setError(field, { message: messages[0] });
        }
      }
      toast("error", err instanceof Error ? err.message : "Gagal menyimpan");
    }
  }

  function renderField(field: CrudField) {
    const error = errors[field.name] as { message?: string } | undefined;
    const common = { id: field.name, "aria-invalid": error ? true : undefined };

    switch (field.type) {
      case "textarea":
        return <Textarea {...register(field.name)} {...common} placeholder={field.placeholder} />;
      case "number":
        return (
          <Input
            type="number"
            step={field.step ?? 1}
            min={field.min}
            max={field.max}
            {...register(field.name)}
            {...common}
            placeholder={field.placeholder}
          />
        );
      case "select":
        return (
          <Select {...register(field.name)} {...common}>
            <option value="">Pilih…</option>
            {field.options?.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        );
      case "date":
        return <Input type="date" {...register(field.name)} {...common} />;
      case "datetime":
        return <Input type="datetime-local" {...register(field.name)} {...common} />;
      case "checkbox":
        return (
          <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
            <input type="checkbox" {...register(field.name)} className="h-4 w-4 rounded border-border accent-primary-700" />
            {field.help ?? field.label}
          </label>
        );
      case "image":
        return (
          <ImageUploader
            value={(watch(field.name) as string) || null}
            onChange={(url) => setValue(field.name, url ?? "", { shouldValidate: true })}
          />
        );
      default:
        return (
          <Input
            {...register(field.name)}
            {...common}
            placeholder={field.placeholder}
            className={field.type === "slug" ? "font-mono" : undefined}
          />
        );
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">
            {mode === "create" ? `Tambah ${config.entityLabel}` : `Edit ${config.entityLabel}`}
          </h1>
          <p className="mt-0.5 text-sm text-ink-soft">{config.title}</p>
        </div>
        <Link href={config.pagePath} className="text-sm font-medium text-ink-soft hover:text-ink">
          ← Kembali
        </Link>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit((v) => void onSubmit(v as Record<string, unknown>))} noValidate>
          <div className="grid gap-5 sm:grid-cols-2">
            {config.fields
              .filter((f) => f.showInForm !== false)
              .map((field) => (
                <div key={field.name} className={field.full ? "sm:col-span-2" : ""}>
                  <Label htmlFor={field.name}>
                    {field.label}
                    {field.required ? <span className="text-red-600"> *</span> : null}
                  </Label>
                  {renderField(field)}
                  {field.help && field.type !== "checkbox" ? (
                    <p className="mt-1 text-xs text-ink-soft">{field.help}</p>
                  ) : null}
                  <FieldError
                    message={(errors[field.name] as { message?: string } | undefined)?.message}
                  />
                </div>
              ))}
          </div>

          <div className="mt-7 flex justify-end gap-2 border-t border-border pt-5">
            <Button type="button" variant="secondary" onClick={() => router.back()} disabled={isSubmitting}>
              Batal
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {isSubmitting ? "Menyimpan…" : mode === "create" ? "Simpan" : "Perbarui"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

/* ==================== Table cell helpers ==================== */

export function MoneyCell({ value, currency = "IDR" }: { value: unknown; currency?: string }) {
  if (value == null || value === "") return <span className="text-ink-soft">-</span>;
  const n = Number(value);
  if (Number.isNaN(n)) return <span>{String(value)}</span>;
  return (
    <span>
      {new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      }).format(n)}
    </span>
  );
}

export function StarsCell({ value }: { value: unknown }) {
  const n = Number(value);
  if (Number.isNaN(n)) return <span>-</span>;
  return <span>{"★".repeat(Math.max(0, Math.min(5, n)))}</span>;
}

export function ImageCell({ value }: { value: unknown }) {
  if (!value) return <span className="text-ink-soft">-</span>;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={String(value)} alt="" className="h-10 w-16 rounded-md object-cover" loading="lazy" />
  );
}

export function cellRenderer(render?: (row: Row) => ReactNode) {
  return render;
}
