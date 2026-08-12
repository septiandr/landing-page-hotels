"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { AlertTriangle } from "lucide-react";
import { PROMOTION_STATUSES, createPromotionSchema, updatePromotionSchema } from "@/lib/validators";
import { ApiClientError, apiPatch, apiPost } from "./api";
import { Button, Card, FieldError, Input, Label, Select, Textarea } from "./ui";
import { ImageUploader } from "./image-uploader";
import { useToast } from "./toast";
import { PublishToolbar } from "./publish-toolbar";

interface PromotionFormProps {
  mode: "create" | "edit";
  id?: string;
  initial?: Record<string, unknown>;
}

export function PromotionForm({ mode, id, initial }: PromotionFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const schema = mode === "create" ? createPromotionSchema : updatePromotionSchema;

  const defaults = useMemo(() => {
    const iso = (v: unknown) => {
      if (!v) return "";
      const d = new Date(String(v));
      if (Number.isNaN(d.getTime())) return "";
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };
    return {
      title: (initial?.title as string) ?? "",
      description: (initial?.description as string) ?? "",
      image: (initial?.image as string) ?? "",
      discountLabel: (initial?.discountLabel as string) ?? "",
      promoCode: (initial?.promoCode as string) ?? "",
      bookingStart: iso(initial?.bookingStart),
      bookingEnd: iso(initial?.bookingEnd),
      stayStart: iso(initial?.stayStart),
      stayEnd: iso(initial?.stayEnd),
      terms: (initial?.terms as string) ?? "",
      ctaLabel: (initial?.ctaLabel as string) ?? "Book Now",
      status: (initial?.status as string) ?? "DRAFT",
      showCountdown: Boolean(initial?.showCountdown),
      sortOrder: (initial?.sortOrder as number) ?? 0,
    };
  }, [initial]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    setValue,
    watch,
  } = useForm<typeof defaults>({
    resolver: standardSchemaResolver(schema) as unknown as Resolver<typeof defaults>,
    defaultValues: defaults,
  });

  const showCountdown = watch("showCountdown");
  const bookingEnd = watch("bookingEnd");
  const countdownWarning = showCountdown && !bookingEnd;

  async function onSubmit(values: typeof defaults) {
    const payload: Record<string, unknown> = {
      ...values,
      bookingStart: values.bookingStart || null,
      bookingEnd: values.bookingEnd || null,
      stayStart: values.stayStart || null,
      stayEnd: values.stayEnd || null,
    };
    try {
      if (mode === "create") {
        await apiPost("/api/admin/promotions", payload);
        toast("success", "Promosi berhasil dibuat");
      } else {
        await apiPatch(`/api/admin/promotions/${id}`, payload);
        toast("success", "Promosi berhasil diperbarui");
      }
      router.push("/admin/promotions");
      router.refresh();
    } catch (err) {
      if (err instanceof ApiClientError && err.fields) {
        for (const [field, messages] of Object.entries(err.fields)) {
          setError(field as keyof typeof defaults, { message: messages[0] });
        }
      }
      toast("error", err instanceof Error ? err.message : "Gagal menyimpan");
    }
  }

  const err = (field: string) =>
    (errors[field as keyof typeof errors] as { message?: string } | undefined)?.message;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">
            {mode === "create" ? "Tambah Promosi" : `Edit Promosi — ${String(initial?.title ?? "")}`}
          </h1>
          <p className="mt-0.5 text-sm text-ink-soft">Promotions</p>
        </div>
        <Link href="/admin/promotions" className="text-sm font-medium text-ink-soft hover:text-ink">
          ← Kembali
        </Link>
      </div>

      {mode === "edit" && id ? (
        <PublishToolbar
          entity="Promotion"
          id={id}
          status={String(initial?.status ?? "DRAFT")}
          previewPath="/"
        />
      ) : null}

      {countdownWarning ? (
        <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Countdown aktif tapi tidak ada <strong>bookingEnd</strong>. Countdown butuh deadline nyata
            (PRD §19) — isi tanggal berakhirnya booking.
          </p>
        </div>
      ) : null}

      <Card className="p-6">
        <form onSubmit={handleSubmit((v) => void onSubmit(v))} noValidate>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="title">Judul *</Label>
              <Input id="title" {...register("title")} placeholder="Stay 3 Nights, Get 1 Night Free" />
              <FieldError message={err("title")} />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea id="description" {...register("description")} />
              <FieldError message={err("description")} />
            </div>

            <div>
              <Label htmlFor="image">Gambar</Label>
              <ImageUploader
                value={(watch("image") as string) || null}
                onChange={(url) => setValue("image", url ?? "", { shouldValidate: true })}
              />
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="discountLabel">Label Diskon</Label>
                <Input id="discountLabel" {...register("discountLabel")} placeholder="15% OFF / 3+1" />
                <FieldError message={err("discountLabel")} />
              </div>
              <div>
                <Label htmlFor="promoCode">Kode Promo</Label>
                <Input id="promoCode" {...register("promoCode")} className="font-mono uppercase" />
                <FieldError message={err("promoCode")} />
              </div>
            </div>

            <div className="sm:col-span-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">Periode Booking</h2>
            </div>
            <div>
              <Label htmlFor="bookingStart">Mulai Booking</Label>
              <Input id="bookingStart" type="datetime-local" {...register("bookingStart")} />
              <FieldError message={err("bookingStart")} />
            </div>
            <div>
              <Label htmlFor="bookingEnd">Berakhir Booking</Label>
              <Input id="bookingEnd" type="datetime-local" {...register("bookingEnd")} />
              <FieldError message={err("bookingEnd")} />
            </div>

            <div className="sm:col-span-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">Periode Menginap</h2>
            </div>
            <div>
              <Label htmlFor="stayStart">Mulai Menginap</Label>
              <Input id="stayStart" type="datetime-local" {...register("stayStart")} />
              <FieldError message={err("stayStart")} />
            </div>
            <div>
              <Label htmlFor="stayEnd">Selesai Menginap</Label>
              <Input id="stayEnd" type="datetime-local" {...register("stayEnd")} />
              <FieldError message={err("stayEnd")} />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="terms">Syarat & Ketentuan</Label>
              <Textarea id="terms" {...register("terms")} placeholder="Berlaku untuk booking langsung…" />
              <FieldError message={err("terms")} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ctaLabel">Label CTA</Label>
                <Input id="ctaLabel" {...register("ctaLabel")} />
              </div>
              <div>
                <Label htmlFor="sortOrder">Urutan</Label>
                <Input id="sortOrder" type="number" {...register("sortOrder")} />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 sm:col-span-2">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
                <input type="checkbox" {...register("showCountdown")} className="h-4 w-4 accent-primary-700" />
                Tampilkan countdown
              </label>
              <div className="flex items-center gap-3">
                <Label htmlFor="status" className="mb-0">Status</Label>
                <Select id="status" {...register("status")} className="w-40">
                  {PROMOTION_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
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
