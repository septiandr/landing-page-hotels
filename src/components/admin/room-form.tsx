"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm, type Resolver } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { Plus, X } from "lucide-react";
import { CONTENT_STATUSES, createRoomSchema, updateRoomSchema } from "@/lib/validators";
import { slugify } from "@/lib/slugify";
import { ApiClientError, apiPatch, apiPost } from "./api";
import { Button, Card, FieldError, Input, Label, Select, Textarea } from "./ui";
import { ImageUploader } from "./image-uploader";
import { useToast } from "./toast";
import { PublishToolbar } from "./publish-toolbar";

interface RoomFormProps {
  mode: "create" | "edit";
  id?: string;
  initial?: Record<string, unknown>;
}

const QUICK_AMENITIES = [
  "Free WiFi",
  "Air Conditioning",
  "Smart TV",
  "Safe",
  "Coffee Machine",
  "Hair Dryer",
  "Refrigerator",
];

export function RoomForm({ mode, id, initial }: RoomFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const schema = mode === "create" ? createRoomSchema : updateRoomSchema;
  const [amenityInput, setAmenityInput] = useState("");

  const defaults = useMemo(
    () => ({
      name: (initial?.name as string) ?? "",
      slug: (initial?.slug as string) ?? "",
      description: (initial?.description as string) ?? "",
      sizeM2: (initial?.sizeM2 as number | string) ?? "",
      maxOccupancy: (initial?.maxOccupancy as number | string) ?? "",
      bedType: (initial?.bedType as string) ?? "",
      bedCount: (initial?.bedCount as number | string) ?? 1,
      view: (initial?.view as string) ?? "",
      priceFrom: (initial?.priceFrom as number | string) ?? "",
      currency: (initial?.currency as string) ?? "IDR",
      breakfastIncluded: Boolean(initial?.breakfastIncluded),
      status: (initial?.status as string) ?? "DRAFT",
      sortOrder: (initial?.sortOrder as number) ?? 0,
      photos: ((initial?.photos as { url: string; altText?: string }[]) ?? []).map((p) => ({
        url: p.url,
        altText: p.altText ?? "",
      })),
      amenities: ((initial?.amenities as { name: string }[]) ?? []).map((a) => ({ name: a.name })),
    }),
    [initial],
  );

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    setValue,
    setError,
    getValues,
  } = useForm<typeof defaults>({
    resolver: standardSchemaResolver(schema) as Resolver<typeof defaults>,
    defaultValues: defaults,
  });

  const photos = useFieldArray({ control, name: "photos" });
  const amenities = useFieldArray({ control, name: "amenities" });

  function addAmenity() {
    const name = amenityInput.trim();
    if (!name) return;
    const exists = getValues("amenities").some((a) => a.name.toLowerCase() === name.toLowerCase());
    if (exists) return;
    amenities.append({ name });
    setAmenityInput("");
  }

  async function onSubmit(values: typeof defaults) {
    const payload: Record<string, unknown> = {
      ...values,
      slug: values.slug.trim() || slugify(String(values.name || "")),
      priceFrom: values.priceFrom === "" ? null : Number(values.priceFrom),
      sizeM2: values.sizeM2 === "" ? null : Number(values.sizeM2),
      maxOccupancy: values.maxOccupancy === "" ? null : Number(values.maxOccupancy),
      bedCount: values.bedCount === "" ? null : Number(values.bedCount),
      photos: values.photos
        .map((p, i) => ({ url: p.url, altText: p.altText || p.url, sortOrder: i + 1 }))
        .filter((p) => p.url),
      amenities: values.amenities.map((a) => ({ name: a.name })),
    };

    try {
      if (mode === "create") {
        await apiPost("/api/admin/rooms", payload);
        toast("success", "Room berhasil dibuat");
      } else {
        await apiPatch(`/api/admin/rooms/${id}`, payload);
        toast("success", "Room berhasil diperbarui");
      }
      router.push("/admin/rooms");
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
  const photosErr = (errors.photos as { message?: string } | undefined)?.message;
  const amenitiesErr = (errors.amenities as { message?: string } | undefined)?.message;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">
            {mode === "create" ? "Tambah Room" : `Edit Room — ${String(initial?.name ?? "")}`}
          </h1>
          <p className="mt-0.5 text-sm text-ink-soft">Rooms</p>
        </div>
        <Link href="/admin/rooms" className="text-sm font-medium text-ink-soft hover:text-ink">
          ← Kembali
        </Link>
      </div>

      {mode === "edit" && id ? (
        <PublishToolbar
          entity="Room"
          id={id}
          status={String(initial?.status ?? "DRAFT")}
          previewPath={`/rooms/${String(initial?.slug ?? "")}`}
        />
      ) : null}

      <Card className="p-6">
        <form onSubmit={handleSubmit((v) => void onSubmit(v as typeof defaults))} noValidate>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="name">Nama Kamar *</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Deluxe King Room"
                onChange={(e) => {
                  setValue("name", e.target.value);
                  if (mode === "create" && !getValues("slug")) {
                    setValue("slug", slugify(e.target.value));
                  }
                }}
              />
              <FieldError message={err("name")} />
            </div>
            <div>
              <Label htmlFor="slug" hint="(auto dari nama)">Slug</Label>
              <Input id="slug" {...register("slug")} className="font-mono" />
              <FieldError message={err("slug")} />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea id="description" {...register("description")} placeholder="Deskripsi kamar…" />
              <FieldError message={err("description")} />
            </div>

            <div>
              <Label htmlFor="sizeM2">Luas (m²)</Label>
              <Input id="sizeM2" type="number" {...register("sizeM2")} />
              <FieldError message={err("sizeM2")} />
            </div>
            <div>
              <Label htmlFor="maxOccupancy">Kapasitas (tamu)</Label>
              <Input id="maxOccupancy" type="number" {...register("maxOccupancy")} />
              <FieldError message={err("maxOccupancy")} />
            </div>

            <div>
              <Label htmlFor="bedType">Tipe Bed</Label>
              <Input id="bedType" {...register("bedType")} placeholder="King / Twin / Queen" />
              <FieldError message={err("bedType")} />
            </div>
            <div>
              <Label htmlFor="bedCount">Jumlah Bed</Label>
              <Input id="bedCount" type="number" {...register("bedCount")} />
              <FieldError message={err("bedCount")} />
            </div>

            <div>
              <Label htmlFor="view">View</Label>
              <Input id="view" {...register("view")} placeholder="City View" />
              <FieldError message={err("view")} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="priceFrom">Harga Mulai</Label>
                <Input id="priceFrom" type="number" step={10000} {...register("priceFrom")} />
                <FieldError message={err("priceFrom")} />
              </div>
              <div>
                <Label htmlFor="currency">Currency</Label>
                <Input id="currency" {...register("currency")} className="uppercase" />
                <FieldError message={err("currency")} />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 sm:col-span-2">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
                <input type="checkbox" {...register("breakfastIncluded")} className="h-4 w-4 accent-primary-700" />
                Sarapan termasuk
              </label>
              <div className="flex items-center gap-3">
                <Label htmlFor="status" className="mb-0">Status</Label>
                <Select id="status" {...register("status")} className="w-40">
                  {CONTENT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex items-center gap-3">
                <Label htmlFor="sortOrder" className="mb-0">Urutan</Label>
                <Input id="sortOrder" type="number" {...register("sortOrder")} className="w-24" />
              </div>
            </div>
          </div>

          {/* Photos */}
          <div className="mt-8 border-t border-border pt-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">Foto Kamar</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {photos.fields.map((field, index) => (
                <div key={field.id} className="relative">
                  <ImageUploader
                    value={String(getValues(`photos.${index}.url`) ?? "")}
                    onChange={(url) => setValue(`photos.${index}.url`, url ?? "", { shouldValidate: true })}
                    aspect="aspect-[4/3]"
                  />
                  <button
                    type="button"
                    aria-label="Hapus foto"
                    onClick={() => photos.remove(index)}
                    className="absolute -right-2 -top-2 rounded-full bg-ink/70 p-1.5 text-white hover:bg-red-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => photos.append({ url: "", altText: "" })}
                className="flex min-h-28 flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-border text-ink-soft transition hover:border-primary-400 hover:text-primary-700"
              >
                <Plus className="h-6 w-6" />
                <span className="text-xs">Tambah foto</span>
              </button>
            </div>
            <FieldError message={photosErr} />
          </div>

          {/* Amenities */}
          <div className="mt-8 border-t border-border pt-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">
              Fasilitas Kamar ({amenities.fields.length})
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {amenities.fields.map((field, index) => (
                <span
                  key={field.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-medium text-primary-800"
                >
                  {String(getValues(`amenities.${index}.name`) ?? "")}
                  <button
                    type="button"
                    aria-label={`Hapus ${String(getValues(`amenities.${index}.name`) ?? "")}`}
                    onClick={() => amenities.remove(index)}
                    className="text-primary-600 hover:text-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <Input
                value={amenityInput}
                onChange={(e) => setAmenityInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addAmenity();
                  }
                }}
                placeholder="Ketik nama fasilitas lalu Enter"
                className="max-w-xs"
                aria-label="Nama fasilitas"
              />
              <Button type="button" variant="secondary" onClick={addAmenity}>
                Tambah
              </Button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {QUICK_AMENITIES.filter(
                (a) => !getValues("amenities").some((x) => x.name.toLowerCase() === a.toLowerCase()),
              ).map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => amenities.append({ name: a })}
                  className="rounded-full border border-border px-2.5 py-0.5 text-xs text-ink-soft transition hover:border-primary-300 hover:text-primary-700"
                >
                  + {a}
                </button>
              ))}
            </div>
            <FieldError message={amenitiesErr} />
          </div>

          <div className="mt-8 flex justify-end gap-2 border-t border-border pt-5">
            <Button type="button" variant="secondary" onClick={() => router.back()} disabled={isSubmitting}>
              Batal
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {isSubmitting ? "Menyimpan…" : mode === "create" ? "Simpan Room" : "Perbarui Room"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
