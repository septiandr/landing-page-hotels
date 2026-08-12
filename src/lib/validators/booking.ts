import { z } from "zod";

/**
 * Validasi booking (BK-001, BK-005).
 * Dipakai di: widget client (validasi inline) & API /api/availability (server).
 * Format tanggal: YYYY-MM-DD (sesuai param Cloudbeds / input type=date).
 */

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD");

/** Hitung selisih malam; null jika tanggal tidak valid. */
function nightsBetween(checkIn: string, checkOut: string): number | null {
  const a = new Date(`${checkIn}T00:00:00`);
  const b = new Date(`${checkOut}T00:00:00`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null;
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

/** Input search dari widget / API. */
export const bookingRequestSchema = z
  .object({
    checkin: dateOnly,
    checkout: dateOnly,
    adults: z.coerce.number().int().min(1, "Minimal 1 dewasa").max(30),
    kids: z.coerce.number().int().min(0, "Anak tidak boleh negatif").max(20),
    rooms: z.coerce.number().int().min(1, "Minimal 1 kamar").max(10),
    code: z
      .string()
      .trim()
      .max(50)
      .optional()
      .transform((v) => (v ? v : undefined)),
  })
  .superRefine((data, ctx) => {
    const nights = nightsBetween(data.checkin, data.checkout);
    if (nights === null) {
      ctx.addIssue({ code: "custom", path: ["checkout"], message: "Tanggal tidak valid" });
      return;
    }
    if (nights < 1) {
      ctx.addIssue({
        code: "custom",
        path: ["checkout"],
        message: "Check-out harus setelah check-in (minimal 1 malam)",
      });
    }
    if (nights > 30) {
      ctx.addIssue({
        code: "custom",
        path: ["checkout"],
        message: "Maksimal 30 malam per pencarian",
      });
    }
  });

export type BookingRequestInput = z.input<typeof bookingRequestSchema>;
export type BookingRequestOutput = z.output<typeof bookingRequestSchema>;

/** Schema validasi inline di widget (error bahasa Indonesia per field). */
export const widgetSearchSchema = z
  .object({
    checkIn: dateOnly,
    checkOut: dateOnly,
    adults: z.coerce.number().int().min(1, "Minimal 1 dewasa").max(30),
    kids: z.coerce.number().int().min(0, "Anak tidak boleh negatif").max(20),
    rooms: z.coerce.number().int().min(1, "Minimal 1 kamar").max(10),
    promoCode: z.string().trim().max(50).optional(),
  })
  .superRefine((data, ctx) => {
    const nights = nightsBetween(data.checkIn, data.checkOut);
    if (nights !== null && nights < 1) {
      ctx.addIssue({
        code: "custom",
        path: ["checkOut"],
        message: "Check-out harus setelah check-in (minimal 1 malam)",
      });
    }
  });

export type WidgetSearchValues = z.input<typeof widgetSearchSchema>;

/** Hitung jumlah malam — export untuk dipakai widget (display total). Clamp negatif → 0. */
export function getNightsBetween(checkIn: string, checkOut: string): number {
  return Math.max(0, nightsBetween(checkIn, checkOut) ?? 0);
}
