/**
 * Tracking event booking (ANA-003).
 *
 * - `booking_started`: client-side, push ke dataLayer (Google Tag Manager)
 *   SEBELUM window.open deep link (BK-008).
 * - `booking_completed`: server-side dari webhook (BK-009) — GA4 Measurement
 *   Protocol bila `GA4_MP_API_SECRET` di-set, else log saja.
 */

export interface BookingStartedParams {
  checkIn: string;
  checkOut: string;
  adults: number;
  kids: number;
  rooms: number;
  roomName?: string;
  promoCode?: string;
}

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

/** Client-only: push `booking_started` sebelum navigasi ke engine. */
export function trackBookingStarted(params: BookingStartedParams): void {
  if (typeof window === "undefined" || !window.dataLayer) return;
  window.dataLayer.push({
    event: "booking_started",
    booking: {
      checkin: params.checkIn,
      checkout: params.checkOut,
      adults: params.adults,
      kids: params.kids,
      rooms: params.rooms,
      room_name: params.roomName,
      promo_code: params.promoCode,
    },
  });
}

export interface BookingCompletedParams {
  reservationId: string;
  propertyId: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Server-only: catat `booking_completed` dari webhook Cloudbeds (BK-009).
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
                name: "booking_completed",
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

  console.info("[tracking] booking_completed", {
    reservationId: params.reservationId,
    propertyId: params.propertyId,
  });
}
