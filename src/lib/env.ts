import { z } from "zod";

/**
 * Validasi environment variables yang aman diakses client (NEXT_PUBLIC_*).
 *
 * Catatan penting: objek env dibangun dari referensi `process.env.NEXT_PUBLIC_*`
 * SATU PER SATU (bukan objek `process.env` utuh) agar Next.js bisa
 * meng-inline nilainya di client bundle. Semua punya default sehingga
 * tidak pernah gagal parse.
 *
 * Env server-only (DATABASE_URL, AUTH_SECRET) dibaca langsung di module
 * server masing-masing, tidak boleh di-import dari client.
 */

/** Normalisasi string kosong -> undefined supaya default Zod berlaku. */
const emptyToUndefined = (v: string | undefined): string | undefined =>
  v === "" ? undefined : v;

const clientEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url().default("http://localhost:3000"),
  NEXT_PUBLIC_WHATSAPP_NUMBER: z.string().default(""),
  NEXT_PUBLIC_GTM_ID: z.string().default(""),
  NEXT_PUBLIC_GA4_ID: z.string().default(""),
  NEXT_PUBLIC_META_PIXEL_ID: z.string().default(""),
  NEXT_PUBLIC_TIKTOK_PIXEL_ID: z.string().default(""),
});

const envInput = {
  NEXT_PUBLIC_SITE_URL: emptyToUndefined(process.env.NEXT_PUBLIC_SITE_URL),
  NEXT_PUBLIC_WHATSAPP_NUMBER: emptyToUndefined(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER),
  NEXT_PUBLIC_GTM_ID: emptyToUndefined(process.env.NEXT_PUBLIC_GTM_ID),
  NEXT_PUBLIC_GA4_ID: emptyToUndefined(process.env.NEXT_PUBLIC_GA4_ID),
  NEXT_PUBLIC_META_PIXEL_ID: emptyToUndefined(process.env.NEXT_PUBLIC_META_PIXEL_ID),
  NEXT_PUBLIC_TIKTOK_PIXEL_ID: emptyToUndefined(process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID),
} as const;

export const env = clientEnvSchema.parse(envInput);
