/**
 * Booking state machine (BK-006) — pure & mudah di-unit-test.
 *
 * States:
 *   idle → validating → loading → available | no-availability | error
 *   idle → invalid-date | invalid-guests (validasi client gagal)
 *
 * `error` = engine down / network → UI fallback WhatsApp/Call (BK-007).
 */

export type BookingState =
  | "idle"
  | "validating"
  | "loading"
  | "available"
  | "no-availability"
  | "error"
  | "invalid-date"
  | "invalid-guests";

export type BookingEvent =
  | { type: "SUBMIT" }
  | { type: "VALIDATE_DATE_FAIL" }
  | { type: "VALIDATE_GUESTS_FAIL" }
  | { type: "SEARCH_START" }
  | { type: "SEARCH_SUCCESS"; hasRates: boolean }
  | { type: "ENGINE_ERROR" }
  | { type: "RESET" };

export function transition(state: BookingState, event: BookingEvent): BookingState {
  // Setiap case meng-encode state asal yang diizinkan — jika tidak cocok,
  // `next` tetap null → state dipertahankan (defensive).
  let next: BookingState | null = null;

  switch (event.type) {
    case "SUBMIT":
      // Submit boleh dari semua state interaktif — termasuk no-availability /
      // invalid-* (user memperbaiki input lalu search ulang, BK-006).
      if (state !== "loading" && state !== "validating") next = "validating";
      break;
    case "VALIDATE_DATE_FAIL":
      next = "invalid-date";
      break;
    case "VALIDATE_GUESTS_FAIL":
      next = "invalid-guests";
      break;
    case "SEARCH_START":
      if (state === "validating" || state === "loading") next = "loading";
      break;
    case "SEARCH_SUCCESS":
      if (state === "loading") next = event.hasRates ? "available" : "no-availability";
      break;
    case "ENGINE_ERROR":
      if (state === "loading") next = "error";
      break;
    case "RESET":
      next = "idle";
      break;
  }

  return next ?? state;
}

/** Sinkronkan validasi form → state (dipanggil widget sebelum submit). */
export function validateSearch(input: {
  checkIn?: string;
  checkOut?: string;
  adults?: number;
  kids?: number;
}): "ok" | "invalid-date" | "invalid-guests" {
  if (!input.checkIn || !input.checkOut) return "invalid-date";
  const a = new Date(`${input.checkIn}T00:00:00`);
  const b = new Date(`${input.checkOut}T00:00:00`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return "invalid-date";
  if (b.getTime() - a.getTime() < 86_400_000) return "invalid-date";

  if (!input.adults || input.adults < 1) return "invalid-guests";
  if (input.kids == null || input.kids < 0) return "invalid-guests";
  return "ok";
}
