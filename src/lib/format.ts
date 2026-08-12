import { differenceInCalendarDays, format, isValid, parseISO, type Locale } from "date-fns";
import { id } from "date-fns/locale";

const CURRENCY_LOCALES: Record<string, string> = {
  IDR: "id-ID",
  USD: "en-US",
  EUR: "de-DE",
  SGD: "en-SG",
  AUD: "en-AU",
};

/** Format tanggal, contoh: "12 Agu 2026" (locale id). */
export function formatDate(
  date: Date | string,
  pattern = "dd MMM yyyy",
  locale: Locale = id,
): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(d)) return "";
  return format(d, pattern, { locale });
}

/** Format mata uang, contoh: "Rp 1.200.000" / "$108". */
export function formatCurrency(amount: number, currency = "IDR"): string {
  return new Intl.NumberFormat(CURRENCY_LOCALES[currency] ?? "id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "IDR" ? 0 : 2,
  }).format(amount);
}

/**
 * Hitung jumlah malam antara check-in dan check-out.
 * Mengembalikan nilai negatif jika check-out sebelum check-in.
 */
export function getNights(checkIn: Date | string, checkOut: Date | string): number {
  const a = typeof checkIn === "string" ? parseISO(checkIn) : checkIn;
  const b = typeof checkOut === "string" ? parseISO(checkOut) : checkOut;
  if (!isValid(a) || !isValid(b)) return 0;
  return differenceInCalendarDays(b, a);
}

export interface DateRange {
  checkIn: Date;
  checkOut: Date;
}

/**
 * Parse rentang tanggal dari search params URL (untuk link shareable),
 * contoh: ?checkin=2026-09-01&checkout=2026-09-03
 * Mengembalikan null jika tidak valid atau < 1 malam.
 */
export function parseDateRange(params: {
  checkin?: string | null;
  checkout?: string | null;
}): DateRange | null {
  if (!params.checkin || !params.checkout) return null;
  const checkIn = parseISO(params.checkin);
  const checkOut = parseISO(params.checkout);
  if (!isValid(checkIn) || !isValid(checkOut)) return null;
  if (getNights(checkIn, checkOut) < 1) return null;
  return { checkIn, checkOut };
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : plural ?? `${singular}s`;
}
