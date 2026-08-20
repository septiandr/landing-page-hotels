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

// ---------- On-Site Booking (walk-in front desk, OSB-007) ----------

/** Status booking — sinkron dengan enum BookingStatus di prisma/schema.prisma. */
export const BOOKING_STATUSES = [
  "CONFIRMED",
  "CHECKED_IN",
  "CHECKED_OUT",
  "CANCELLED",
  "NO_SHOW",
] as const;

export const bookingStatusSchema = z.enum(BOOKING_STATUSES);

/** Metode pembayaran di tempat — tanpa data kartu (PRD §51). */
export const PAYMENT_METHODS = ["CASH", "CARD", "TRANSFER"] as const;
export const paymentMethodSchema = z.enum(PAYMENT_METHODS);

/** Tanggal YYYY-MM-DD untuk input form/create on-site booking. */
const dateInput = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD");

/** Phone — cukup 8..15 digit, boleh +62 (front desk fleksibel). */
const guestPhoneSchema = z
  .string("Nomor HP wajib diisi")
  .min(8, "Nomor HP minimal 8 digit")
  .max(16, "Nomor HP terlalu panjang")
  .regex(/^\+?\d[\d\s-]*$/, "Nomor HP tidak valid");

/** Harga walk-in (Decimal di DB) — input string/angka. */
const priceInput = z.coerce
  .number("Harga harus berupa angka")
  .positive("Harga harus lebih dari 0")
  .max(1_000_000_000, "Harga melebihi batas");

/** Email opsional — string kosong (form) dinormalisasi jadi null. */
const optionalEmail = z
  .union([z.literal(""), z.email("Email tidak valid")])
  .transform((v) => (v === "" ? null : v))
  .nullable()
  .optional();

/** Create walk-in booking (OSB-003) — `.strict()` tolak field tak dikenal. */
export const createOnsiteBookingSchema = z
  .object({
    roomTypeId: z.string("Pilih tipe kamar").min(1, "Pilih tipe kamar"),
    checkIn: dateInput,
    checkOut: dateInput,
    adults: z.coerce.number().int().min(1, "Minimal 1 dewasa").max(30),
    kids: z.coerce.number().int().min(0, "Anak tidak boleh negatif").max(20).default(0),
    guestName: z.string("Nama tamu wajib diisi").trim().min(1, "Nama tamu wajib diisi").max(200),
    guestPhone: guestPhoneSchema,
    guestEmail: optionalEmail,
    guestIdNumber: z.string().trim().max(50).optional().nullable(),
    pricePerNight: priceInput,
    paymentMethod: paymentMethodSchema.optional().nullable(),
    notes: z.string().trim().max(2_000).optional().nullable(),
  })
  .strict()
  .superRefine((data, ctx) => {
    const n = nightsBetween(data.checkIn, data.checkOut);
    if (n === null) {
      ctx.addIssue({ code: "custom", path: ["checkOut"], message: "Tanggal tidak valid" });
      return;
    }
    if (n < 1) {
      ctx.addIssue({
        code: "custom",
        path: ["checkOut"],
        message: "Check-out harus setelah check-in (minimal 1 malam)",
      });
    }
    if (n > 60) {
      ctx.addIssue({
        code: "custom",
        path: ["checkOut"],
        message: "Maksimal 60 malam per booking",
      });
    }
  });

export type CreateOnsiteBookingInput = z.input<typeof createOnsiteBookingSchema>;
export type CreateOnsiteBookingOutput = z.output<typeof createOnsiteBookingSchema>;

/** Aksi transisi status (OSB-005). */
export const bookingStatusActionSchema = z.enum(["CHECK_IN", "CHECK_OUT", "CANCEL", "NO_SHOW"]);
export type BookingStatusAction = z.output<typeof bookingStatusActionSchema>;

/** Body PATCH status (OSB-005). */
export const bookingStatusPatchSchema = z
  .object({
    action: bookingStatusActionSchema,
    cancellationReason: z.string().trim().max(2_000).optional().nullable(),
  })
  .strict();

export type BookingStatusPatchInput = z.input<typeof bookingStatusPatchSchema>;
