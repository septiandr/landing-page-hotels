"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { updateHotelSchema } from "@/lib/validators";
import { ApiClientError, apiPatch } from "./api";
import { Button, Card, FieldError, Input, Label, Textarea } from "./ui";
import { ImageUploader } from "./image-uploader";
import { useToast } from "./toast";

interface HotelFormProps {
  initial: Record<string, unknown>;
}

export function HotelForm({ initial }: HotelFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const defaults = useMemo(() => {
    const social = (initial.socialLinks as Record<string, unknown>) ?? {};
    return {
      name: (initial.name as string) ?? "",
      logo: (initial.logo as string) ?? "",
      tagline: (initial.tagline as string) ?? "",
      description: (initial.description as string) ?? "",
      story: (initial.story as string) ?? "",
      address: (initial.address as string) ?? "",
      phone: (initial.phone as string) ?? "",
      email: (initial.email as string) ?? "",
      whatsapp: (initial.whatsapp as string) ?? "",
      "socialLinks.instagram": (social.instagram as string) ?? "",
      "socialLinks.facebook": (social.facebook as string) ?? "",
      "socialLinks.tiktok": (social.tiktok as string) ?? "",
      lat: (initial.lat as number | string) ?? "",
      lng: (initial.lng as number | string) ?? "",
      checkInTime: (initial.checkInTime as string) ?? "14:00",
      checkOutTime: (initial.checkOutTime as string) ?? "12:00",
      currency: (initial.currency as string) ?? "IDR",
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
    resolver: standardSchemaResolver(updateHotelSchema) as unknown as Resolver<typeof defaults>,
    defaultValues: defaults,
  });

  async function onSubmit(values: typeof defaults) {
    const socialLinks: Record<string, string> = {};
    for (const key of ["instagram", "facebook", "tiktok"] as const) {
      const v = String(values[`socialLinks.${key}`] ?? "").trim();
      if (v) socialLinks[key] = v;
    }
    const payload: Record<string, unknown> = {
      name: values.name,
      logo: values.logo || null,
      tagline: values.tagline || null,
      description: values.description || null,
      story: values.story || null,
      address: values.address || null,
      phone: values.phone || null,
      email: values.email || null,
      whatsapp: values.whatsapp,
      socialLinks: Object.keys(socialLinks).length ? socialLinks : null,
      lat: values.lat === "" ? null : Number(values.lat),
      lng: values.lng === "" ? null : Number(values.lng),
      checkInTime: values.checkInTime,
      checkOutTime: values.checkOutTime,
      currency: values.currency.toUpperCase(),
    };

    try {
      await apiPatch("/api/admin/hotel", payload);
      toast("success", "Profil hotel tersimpan");
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
    <Card className="p-6">
      <form onSubmit={handleSubmit((v) => void onSubmit(v as typeof defaults))} noValidate>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="name">Nama Hotel *</Label>
            <Input id="name" {...register("name")} />
            <FieldError message={err("name")} />
          </div>
          <div>
            <Label htmlFor="whatsapp" hint="(62xxx)">WhatsApp *</Label>
            <Input id="whatsapp" {...register("whatsapp")} />
            <FieldError message={err("whatsapp")} />
          </div>

          <div className="sm:col-span-2">
            <Label>Logo</Label>
            <div className="max-w-xs">
              <ImageUploader
                value={(watch("logo") as string) || null}
                onChange={(url) => setValue("logo", url ?? "", { shouldValidate: true })}
                aspect="aspect-[4/3]"
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="tagline">Tagline</Label>
            <Input id="tagline" {...register("tagline")} />
            <FieldError message={err("tagline")} />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea id="description" {...register("description")} />
            <FieldError message={err("description")} />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="story">Cerita Hotel</Label>
            <Textarea id="story" {...register("story")} />
            <FieldError message={err("story")} />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="address">Alamat</Label>
            <Input id="address" {...register("address")} />
            <FieldError message={err("address")} />
          </div>

          <div>
            <Label htmlFor="phone">Telepon</Label>
            <Input id="phone" {...register("phone")} />
            <FieldError message={err("phone")} />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register("email")} />
            <FieldError message={err("email")} />
          </div>

          <div className="sm:col-span-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">Sosial Media</h2>
          </div>
          <div>
            <Label htmlFor="socialLinks.instagram">Instagram</Label>
            <Input id="socialLinks.instagram" {...register("socialLinks.instagram")} placeholder="https://instagram.com/…" />
            <FieldError message={err("socialLinks.instagram")} />
          </div>
          <div>
            <Label htmlFor="socialLinks.facebook">Facebook</Label>
            <Input id="socialLinks.facebook" {...register("socialLinks.facebook")} placeholder="https://facebook.com/…" />
            <FieldError message={err("socialLinks.facebook")} />
          </div>
          <div>
            <Label htmlFor="socialLinks.tiktok">TikTok</Label>
            <Input id="socialLinks.tiktok" {...register("socialLinks.tiktok")} placeholder="https://tiktok.com/…" />
            <FieldError message={err("socialLinks.tiktok")} />
          </div>

          <div>
            <Label htmlFor="lat">Latitude</Label>
            <Input id="lat" type="number" step="0.0001" {...register("lat")} />
            <FieldError message={err("lat")} />
          </div>
          <div>
            <Label htmlFor="lng">Longitude</Label>
            <Input id="lng" type="number" step="0.0001" {...register("lng")} />
            <FieldError message={err("lng")} />
          </div>

          <div>
            <Label htmlFor="checkInTime" hint="(HH:MM)">Check-in</Label>
            <Input id="checkInTime" {...register("checkInTime")} />
            <FieldError message={err("checkInTime")} />
          </div>
          <div>
            <Label htmlFor="checkOutTime" hint="(HH:MM)">Check-out</Label>
            <Input id="checkOutTime" {...register("checkOutTime")} />
            <FieldError message={err("checkOutTime")} />
          </div>

          <div>
            <Label htmlFor="currency">Currency</Label>
            <Input id="currency" {...register("currency")} className="uppercase" />
            <FieldError message={err("currency")} />
          </div>
        </div>

        <div className="mt-7 flex justify-end border-t border-border pt-5">
          <Button type="submit" loading={isSubmitting}>
            {isSubmitting ? "Menyimpan…" : "Simpan Profil"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
