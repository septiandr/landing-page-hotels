import { env } from "@/lib/env";
import type { BookingInitRequest } from "./types";

/**
 * Builder deep link ke Hosted Booking Engine Cloudbeds (BK-008).
 *
 * URL engine menerima param saat initial load: checkin, checkout, adults,
 * kids, currency, promo, room_type, base_rates_only.
 * Payment & konfirmasi ditangani penuh oleh Cloudbeds (PRD §30).
 *
 * `buildBookingUrl` mengembalikan null jika `NEXT_PUBLIC_CLOUDBEDS_PROPERTY_CODE`
 * kosong — caller harus pakai fallback WhatsApp (BK-007).
 */

/** Pure builder — testable tanpa env. */
export function buildDeepLinkUrl(code: string, req: BookingInitRequest): string {
  const url = new URL(`https://hotels.cloudbeds.com/reservation/${code}`);
  url.searchParams.set("checkin", req.checkIn);
  url.searchParams.set("checkout", req.checkOut);
  url.searchParams.set("adults", String(req.adults));
  url.searchParams.set("kids", String(req.kids));
  if (req.rooms > 1) url.searchParams.set("rooms", String(req.rooms));
  if (req.promoCode) url.searchParams.set("promo", req.promoCode);
  if (req.roomType) {
    url.searchParams.set("room_type", req.roomType);
    url.searchParams.set("base_rates_only", "1");
  }
  return url.toString();
}

export function buildBookingUrl(req: BookingInitRequest): string | null {
  const code = env.NEXT_PUBLIC_CLOUDBEDS_PROPERTY_CODE;
  if (!code) return null;
  return buildDeepLinkUrl(code, req);
}
