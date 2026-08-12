"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { seoSchema } from "@/lib/validators";
import { ApiClientError, apiPatch } from "./api";
import { Button, Card, FieldError, Input, Label, Textarea } from "./ui";
import { ImageUploader } from "./image-uploader";
import { useToast } from "./toast";

interface SeoFormProps {
  initial: Record<string, unknown>;
  siteUrl: string;
}

function counter(value: string | undefined, max: number) {
  const len = value?.length ?? 0;
  return { len, max, over: len > max };
}

export function SeoForm({ initial, siteUrl }: SeoFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const defaults = useMemo(
    () => ({
      metaTitle: (initial.metaTitle as string) ?? "",
      metaDescription: (initial.metaDescription as string) ?? "",
      ogTitle: (initial.ogTitle as string) ?? "",
      ogDescription: (initial.ogDescription as string) ?? "",
      ogImage: (initial.ogImage as string) ?? "",
      canonicalUrl: (initial.canonicalUrl as string) ?? "",
    }),
    [initial],
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    setValue,
    watch,
  } = useForm({
    resolver: standardSchemaResolver(seoSchema),
    defaultValues: defaults,
  });

  const metaTitle = watch("metaTitle") ?? "";
  const metaDescription = watch("metaDescription") ?? "";
  const titleCount = counter(metaTitle, 60);
  const descCount = counter(metaDescription, 160);

  async function onSubmit(values: typeof defaults) {
    const payload: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(values)) {
      payload[k] = v === "" ? null : v;
    }
    try {
      await apiPatch("/api/admin/hotel/seo", payload);
      toast("success", "SEO tersimpan — landing page diperbarui");
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
    <div className="grid gap-6 lg:grid-cols-5">
      <Card className="p-6 lg:col-span-3">
        <form onSubmit={handleSubmit((v) => void onSubmit(v as typeof defaults))} noValidate>
          <div className="space-y-5">
            <div>
              <Label htmlFor="metaTitle">Meta Title</Label>
              <Input id="metaTitle" {...register("metaTitle")} placeholder="Taman Sari Heritage Hotel | …" />
              <div className="mt-1 flex justify-between">
                <FieldError message={err("metaTitle")} />
                <span className={`text-xs ${titleCount.over ? "text-red-600" : "text-ink-soft"}`}>
                  {titleCount.len}/{titleCount.max}
                </span>
              </div>
            </div>

            <div>
              <Label htmlFor="metaDescription">Meta Description</Label>
              <Textarea id="metaDescription" {...register("metaDescription")} className="min-h-20" />
              <div className="mt-1 flex justify-between">
                <FieldError message={err("metaDescription")} />
                <span className={`text-xs ${descCount.over ? "text-red-600" : "text-ink-soft"}`}>
                  {descCount.len}/{descCount.max}
                </span>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">Open Graph</h2>
            </div>
            <div>
              <Label htmlFor="ogTitle">OG Title</Label>
              <Input id="ogTitle" {...register("ogTitle")} />
              <FieldError message={err("ogTitle")} />
            </div>
            <div>
              <Label htmlFor="ogDescription">OG Description</Label>
              <Textarea id="ogDescription" {...register("ogDescription")} className="min-h-20" />
              <FieldError message={err("ogDescription")} />
            </div>
            <div>
              <Label>OG Image</Label>
              <div className="max-w-xs">
                <ImageUploader
                  value={(watch("ogImage") as string) || null}
                  onChange={(url) => setValue("ogImage", url ?? "", { shouldValidate: true })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="canonicalUrl">Canonical URL</Label>
              <Input id="canonicalUrl" {...register("canonicalUrl")} placeholder={siteUrl} />
              <FieldError message={err("canonicalUrl")} />
            </div>
          </div>

          <div className="mt-7 flex justify-end border-t border-border pt-5">
            <Button type="submit" loading={isSubmitting}>
              {isSubmitting ? "Menyimpan…" : "Simpan SEO"}
            </Button>
          </div>
        </form>
      </Card>

      {/* Google preview live */}
      <div className="lg:col-span-2">
        <Card className="sticky top-24 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">Google Preview</h2>
          <div className="mt-4 space-y-2">
            <p className="text-xs text-emerald-700">{siteUrl.replace(/^https?:\/\//, "")}</p>
            <p className={`font-medium leading-snug text-blue-700 ${titleCount.over ? "line-through opacity-60" : ""}`}>
              {metaTitle || "Meta title akan tampil di sini"}
            </p>
            <p className="text-sm leading-relaxed text-ink-soft">
              {metaDescription || "Meta description — ajakan singkat yang menarik klik (maks 160 karakter)."}
            </p>
          </div>
          <p className="mt-4 text-xs text-ink-soft">
            Cek di Google Search Console setelah deploy — pastikan halaman di-index (SEO-002).
          </p>
        </Card>
      </div>
    </div>
  );
}
