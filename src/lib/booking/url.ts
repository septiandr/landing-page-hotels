/**
 * Builder URL availability yang shareable (BK-011 / BK-008).
 * Widget booking (BK-001) membaca param ini saat mount untuk pre-fill.
 */

export interface AvailabilityUrlParams {
  /** YYYY-MM-DD */
  checkIn?: string;
  /** YYYY-MM-DD */
  checkOut?: string;
  adults?: number;
  kids?: number;
  rooms?: number;
  /** promo code */
  code?: string;
  /** slug room (mis. "deluxe-king-room") */
  room?: string;
}

export function buildAvailabilityUrl(params: AvailabilityUrlParams = {}): string {
  const qs = new URLSearchParams();
  if (params.checkIn) qs.set("checkin", params.checkIn);
  if (params.checkOut) qs.set("checkout", params.checkOut);
  if (params.adults != null) qs.set("adults", String(params.adults));
  if (params.kids != null) qs.set("kids", String(params.kids));
  if (params.rooms != null) qs.set("rooms", String(params.rooms));
  if (params.code) qs.set("code", params.code);
  if (params.room) qs.set("room", params.room);

  const q = qs.toString();
  return q ? `/?${q}#booking` : "/#booking";
}
