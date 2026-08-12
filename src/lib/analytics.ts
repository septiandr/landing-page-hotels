/**
 * ANA-003 — Satu titik tracking analytics (PRD §43).
 *
 * Semua event lewat `track()` → dataLayer (GTM) + forward gtag/fbq/ttq.
 * Tidak ada dataLayer.push tersebar di komponen.
 *
 * `event_id` (ANA-004): uuid per attempt booking — konsisten di seluruh
 * langkah funnel (search → select → started → completed).
 */

export const EVENTS = {
  bookingWidgetView: "booking_widget_view",
  bookingWidgetOpen: "booking_widget_open",
  searchAvailability: "search_availability",
  viewRoom: "view_room",
  selectRoom: "select_room",
  clickBookNow: "click_book_now",
  bookingStarted: "booking_started",
  bookingCompleted: "booking_completed",
  viewPromotion: "view_promotion",
  clickPromotion: "click_promotion",
  viewGallery: "view_gallery",
  clickMap: "click_map",
  clickPhone: "click_phone",
  clickWhatsapp: "click_whatsapp",
  clickEmail: "click_email",
  viewFaq: "view_faq",
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];

type AnalyticsWindow = Window & {
  dataLayer?: Record<string, unknown>[];
  gtag?: (...args: unknown[]) => void;
  fbq?: (...args: unknown[]) => void;
  ttq?: (...args: unknown[]) => void;
};

/** Client-only: push event ke dataLayer + forward ke gtag/fbq/ttq. */
export function track(event: EventName, params?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  const w = window as AnalyticsWindow;
  w.dataLayer?.push({ event, ...(params ?? {}) });
  w.gtag?.("event", event, params ?? {});
  w.fbq?.("trackCustom", event, params ?? {});
  w.ttq?.("track", event, params ?? {});
}

/** event_id unik per attempt (ANA-004) — crypto.randomUUID dengan fallback. */
export function createEventId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `e_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export interface BookingStartedParams {
  eventId: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  kids: number;
  rooms: number;
  roomName?: string;
  promoCode?: string;
}

/** `booking_started` — sebelum buka deep link engine (BK-008). */
export function trackBookingStarted(params: BookingStartedParams): void {
  track(EVENTS.bookingStarted, {
    event_id: params.eventId,
    checkin: params.checkIn,
    checkout: params.checkOut,
    adults: params.adults,
    kids: params.kids,
    rooms: params.rooms,
    room_name: params.roomName,
    promo_code: params.promoCode,
  });
}

export interface BookingCompletedParams {
  reservationId: string;
  propertyId: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Server-only: `booking_completed` dari webhook Cloudbeds (BK-009).
 * Kirim ke GA4 Measurement Protocol jika dikonfigurasi, else log.
 */
export async function trackBookingCompleted(params: BookingCompletedParams): Promise<void> {
  const apiSecret = process.env.GA4_MP_API_SECRET;
  const measurementId = process.env.GA4_MP_MEASUREMENT_ID;

  if (apiSecret && measurementId) {
    try {
      await fetch(
        `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            client_id: `cloudbeds-${params.reservationId}`,
            events: [
              {
                name: EVENTS.bookingCompleted,
                params: {
                  transaction_id: params.reservationId,
                  property_id: params.propertyId,
                  start_date: params.startDate,
                  end_date: params.endDate,
                  currency: "IDR",
                },
              },
            ],
          }),
          signal: AbortSignal.timeout(5_000),
        },
      ).catch(() => null);
    } catch {
      // Gagal tracking tidak boleh menggagalkan webhook — log saja.
    }
  }

  console.info("[analytics] booking_completed", {
    reservationId: params.reservationId,
    propertyId: params.propertyId,
  });
}
