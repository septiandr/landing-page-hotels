import { z } from "zod";

/**
 * Primitif & enum shared untuk semua schema validator (DATA-005).
 * Satu sumber kebenaran untuk CMS form + API handler.
 *
 * Konvensi:
 * - create  = `baseSchema.extend({ defaulted }).strict()` — tolak field tak dikenal
 * - update  = `baseSchema.partial()` — TANPA `.default()` agar handler CMS
 *   tidak me-reset field yang tidak dikirim (lihat room.ts untuk contoh).
 * - Tidak ada `z.any()` di seluruh module ini.
 */

// ---------- Enum values (sinkron dengan prisma/schema.prisma) ----------

export const CONTENT_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
export const PROMOTION_STATUSES = ["DRAFT", "SCHEDULED", "ACTIVE", "EXPIRED"] as const;
export const ROLES = ["ADMIN", "MARKETING", "EDITOR", "VIEWER"] as const;
export const GALLERY_CATEGORIES = [
  "ALL",
  "ROOMS",
  "FACILITIES",
  "DINING",
  "EXTERIOR",
  "SURROUNDINGS",
] as const;
export const FAQ_CATEGORIES = ["BOOKING", "HOTEL", "FACILITIES", "FAMILY"] as const;
export const AMENITY_GROUPS = ["HOTEL", "ROOM"] as const;

export const contentStatusSchema = z.enum(CONTENT_STATUSES);
export const promotionStatusSchema = z.enum(PROMOTION_STATUSES);
export const roleSchema = z.enum(ROLES);
export const galleryCategorySchema = z.enum(GALLERY_CATEGORIES);
export const faqCategorySchema = z.enum(FAQ_CATEGORIES);
export const amenityGroupSchema = z.enum(AMENITY_GROUPS);

// ---------- String ----------

/**
 * Wajib diisi — pesan error konsisten di semua form.
 * Pesan dipasang di level type (z.string("Wajib diisi")) agar juga muncul
 * saat field sama sekali tidak dikirim (bukan hanya saat string kosong).
 */
export const requiredString = z.string("Wajib diisi").min(1, "Wajib diisi");

/** Teks panjang (description, review, terms, dst). */
export const textArea = z.string("Wajib diisi").trim().min(1, "Wajib diisi").max(20_000);

/** String opsional; string kosong dari form dinormalisasi jadi null. */
export const optionalString = z
  .string()
  .max(10_000)
  .transform((v) => (v === "" ? null : v))
  .nullable()
  .optional();

// ---------- URL / Image ----------

/** URL http(s) atau path lokal upload (diawali "/"). */
export const imageUrlOrPath = z.union([
  z.url("URL tidak valid"),
  z.string().regex(/^\//, "Path lokal harus diawali / (contoh: /uploads/room1.jpg)"),
]);

/** Image opsional (nullable). */
export const optionalImage = imageUrlOrPath.nullable().optional();

// ---------- Format khusus ----------

/** WhatsApp format internasional 62xxx (PRD §8). Menerima "+62..." juga. */
export const whatsappSchema = z
  .string()
  .regex(/^\+?62\d{7,14}$/, "Format WhatsApp harus diawali 62 (contoh: 6281234567890)");

export const emailSchema = z.email("Email tidak valid");

/** Slug URL: huruf kecil, angka, strip (contoh: deluxe-king-room). */
export const slugSchema = z
  .string("Wajib diisi")
  .min(1, "Wajib diisi")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug hanya huruf kecil, angka, dan tanda hubung (-)");

/** Jam check-in/out, format HH:MM (contoh: 14:00). */
export const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Format jam harus HH:MM (contoh: 14:00)");

/** Kode currency 3 huruf (IDR, USD, ...). */
export const currencySchema = z
  .string()
  .regex(/^[A-Z]{3}$/, "Kode currency 3 huruf (contoh: IDR)");

// ---------- Number / Boolean / Date ----------

/** Harga (Decimal di DB — input form bisa string/angka). */
export const moneySchema = z.coerce
  .number("Harga harus berupa angka")
  .nonnegative("Harga tidak boleh negatif")
  .max(1_000_000_000, "Harga melebihi batas");

/** Urutan tampilan — TANPA default (default ditambahkan di schema create). */
export const sortOrderSchema = z.coerce.number().int().min(0).max(1_000_000);

export const latSchema = z.coerce.number("Latitude harus berupa angka").min(-90).max(90);
export const lngSchema = z.coerce.number("Longitude harus berupa angka").min(-180).max(180);

/**
 * Boolean dari form.
 * Catatan: `z.coerce.boolean()` di Zod v4.4 mengubah string "false" menjadi
 * true (truthiness `Boolean("false")`), jadi diparse eksplisit di sini:
 * boolean asli, string "true"/"false", dan 1/0 diterima.
 */
export const coerceBool = z
  .unknown()
  .transform((v, ctx): boolean => {
    if (typeof v === "boolean") return v;
    if (v === "true" || v === "1" || v === 1) return true;
    if (v === "false" || v === "0" || v === 0) return false;
    ctx.addIssue({ code: "custom", message: "Harus berupa boolean (true/false)" });
    return z.NEVER;
  });

/** Tanggal dari form (ISO string) atau Date. */
export const optionalDate = z.coerce.date("Tanggal tidak valid").nullable().optional();
