"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { createOnsiteBookingSchema } from "@/lib/validators";
import { getNightsBetween } from "@/lib/validators/booking";
import { ApiClientError, apiPost } from "./api";
import { Button, Card, FieldError, FormSection, Input, Label, Select, Textarea } from "./ui";
import { useToast } from "./toast";
import { formatCurrency } from "@/lib/format";

interface RoomOption {
  id: string;
  name: string;
  slug: string;
  priceFrom: string | number | null;
  currency: string;
}

interface BookingFormProps {
  rooms: RoomOption[];
}

type FormValues = {
  roomTypeId: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  kids: number;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  guestIdNumber: string;
  pricePerNight: number;
  paymentMethod: "" | "CASH" | "CARD" | "TRANSFER";
  notes: string;
};

export function BookingForm({ rooms }: BookingFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [engineError, setEngineError] = useState<string | null>(null);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const defaultPrice = rooms[0] ? Number(rooms[0].priceFrom ?? 0) : 0;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: standardSchemaResolver(createOnsiteBookingSchema) as Resolver<FormValues>,
    defaultValues: {
      roomTypeId: rooms[0]?.id ?? "",
      checkIn: today,
      checkOut: "",
      adults: 2,
      kids: 0,
      guestName: "",
      guestPhone: "",
      guestEmail: "",
      guestIdNumber: "",
      pricePerNight: defaultPrice,
      paymentMethod: "CASH",
      notes: "",
    },
  });

  const [roomTypeId, checkIn, checkOut, pricePerNight] = watch([
    "roomTypeId",
    "checkIn",
    "checkOut",
    "pricePerNight",
  ]);
  const selectedRoom = rooms.find((r) => r.id === roomTypeId);
  const nights = getNightsBetween(checkIn, checkOut);
  const totalPrice = nights > 0 ? Number(pricePerNight || 0) * nights : 0;

  async function onSubmit(values: FormValues) {
    setEngineError(null);
    try {
      const booking = await apiPost<{ id: string }>("/api/admin/bookings", {
        ...values,
        guestEmail: values.guestEmail.trim() || null,
        guestIdNumber: values.guestIdNumber.trim() || null,
        paymentMethod: values.paymentMethod || null,
        notes: values.notes.trim() || null,
        pricePerNight: Number(values.pricePerNight),
      });
      toast("success", "Booking berhasil dibuat & tercatat di engine");
      router.push(`/admin/bookings/${booking.id}`);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.status === 409) {
          setEngineError(
            err.message === "ROOM_UNAVAILABLE"
              ? "Kamar tidak tersedia di tanggal tersebut. Coba tanggal lain."
              : err.message,
          );
        } else if (err.status === 502) {
          setEngineError("Booking engine sedang bermasalah. Silakan hubungi tim reservasi.");
        } else if (err.fields) {
          for (const [field, messages] of Object.entries(err.fields)) {
            setError(field as keyof FormValues, { message: messages[0] });
          }
        }
      }
      if (!(err instanceof ApiClientError) || err.status >= 500) {
        toast("error", err instanceof Error ? err.message : "Gagal menyimpan booking");
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {engineError ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {engineError}
        </div>
      ) : null}

      <Card className="p-5">
        <FormSection title="Kamar & Tanggal">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="roomTypeId">Tipe Kamar</Label>
              <Select
                id="roomTypeId"
                {...register("roomTypeId")}
                onChange={(e) => {
                  register("roomTypeId").onChange(e);
                  const room = rooms.find((r) => r.id === e.target.value);
                  if (room && room.priceFrom != null) {
                    setValue("pricePerNight", Number(room.priceFrom), { shouldValidate: true });
                  }
                }}
              >
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name} — {formatCurrency(Number(room.priceFrom ?? 0), room.currency)}
                  </option>
                ))}
              </Select>
              <FieldError message={errors.roomTypeId?.message} />
            </div>
            <div>
              <Label htmlFor="checkIn">Check-in</Label>
              <Input
                id="checkIn"
                type="date"
                min={today}
                {...register("checkIn")}
              />
              <FieldError message={errors.checkIn?.message} />
            </div>
            <div>
              <Label htmlFor="checkOut">Check-out</Label>
              <Input
                id="checkOut"
                type="date"
                min={checkIn || today}
                {...register("checkOut")}
              />
              <FieldError message={errors.checkOut?.message} />
            </div>
            <div>
              <Label htmlFor="adults">Dewasa</Label>
              <Input id="adults" type="number" min={1} max={30} {...register("adults")} />
              <FieldError message={errors.adults?.message} />
            </div>
            <div>
              <Label htmlFor="kids">Anak</Label>
              <Input id="kids" type="number" min={0} max={20} {...register("kids")} />
              <FieldError message={errors.kids?.message} />
            </div>
            <div>
              <Label htmlFor="pricePerNight" hint="harga per malam — bisa disesuaikan">
                Harga per Malam
              </Label>
              <Input id="pricePerNight" type="number" step="0.01" min={0} {...register("pricePerNight")} />
              <FieldError message={errors.pricePerNight?.message} />
            </div>
            <div>
              <Label htmlFor="paymentMethod">Metode Pembayaran</Label>
              <Select id="paymentMethod" {...register("paymentMethod")}>
                <option value="CASH">Cash</option>
                <option value="CARD">Kartu</option>
                <option value="TRANSFER">Transfer</option>
              </Select>
              <FieldError message={errors.paymentMethod?.message} />
            </div>
          </div>

          <div className="mt-4 rounded-lg bg-surface px-4 py-3">
            <p className="text-sm text-ink-soft">
              {selectedRoom ? `${selectedRoom.name} · ` : ""}
              {nights > 0 ? `${nights} malam` : "pilih tanggal"}
            </p>
            <p className="mt-0.5 font-display text-xl font-semibold text-ink">
              {nights > 0
                ? formatCurrency(totalPrice, selectedRoom?.currency ?? "IDR")
                : "—"}
            </p>
          </div>
        </FormSection>
      </Card>

      <Card className="p-5">
        <FormSection title="Data Tamu">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="guestName">Nama Tamu</Label>
              <Input id="guestName" placeholder="Nama lengkap" {...register("guestName")} />
              <FieldError message={errors.guestName?.message} />
            </div>
            <div>
              <Label htmlFor="guestPhone">No. HP</Label>
              <Input id="guestPhone" placeholder="08xxxxxxxxxx" {...register("guestPhone")} />
              <FieldError message={errors.guestPhone?.message} />
            </div>
            <div>
              <Label htmlFor="guestEmail">Email (opsional)</Label>
              <Input id="guestEmail" type="email" {...register("guestEmail")} />
              <FieldError message={errors.guestEmail?.message} />
            </div>
            <div>
              <Label htmlFor="guestIdNumber">No. Identitas (opsional)</Label>
              <Input id="guestIdNumber" placeholder="KTP / paspor" {...register("guestIdNumber")} />
              <FieldError message={errors.guestIdNumber?.message} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="notes">Catatan (opsional)</Label>
              <Textarea id="notes" placeholder="Preferensi kamar, kedatangan, dsb." {...register("notes")} />
              <FieldError message={errors.notes?.message} />
            </div>
          </div>
        </FormSection>
      </Card>

      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push("/admin/bookings")}
          disabled={isSubmitting}
        >
          Batal
        </Button>
        <Button type="submit" loading={isSubmitting}>
          Buat Booking
        </Button>
      </div>
    </form>
  );
}