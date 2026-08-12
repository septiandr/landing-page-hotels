/**
 * Kontrak booking engine (BK-002) — adapter pattern.
 * UI tidak pernah tahu provider mana yang aktif; semua lewat interface ini.
 */

export interface AvailabilityRequest {
  /** YYYY-MM-DD */
  checkIn: string;
  /** YYYY-MM-DD */
  checkOut: string;
  adults: number;
  kids: number;
  rooms: number;
  promoCode?: string;
  /** Slug room CMS (opsional — filter hasil ke satu room). */
  roomSlug?: string;
}

export interface RateOption {
  /** room_id di Cloudbeds / id room di CMS (mock). */
  roomId: string;
  roomName: string;
  /** Slug room CMS bila tersedia (untuk link detail room). */
  roomSlug?: string;
  ratePlanId?: string | null;
  /** Tipe room 3 huruf di engine (param `room_type` deep link). */
  roomType?: string;
  /** Harga rata-rata per malam (dari total). */
  pricePerNight: number;
  currency: string;
  /** Total seluruh malam. */
  totalPrice: number;
  available: boolean;
  taxIncluded: boolean;
  cancellationPolicy?: string;
}

export interface AvailabilityResponse {
  rates: RateOption[];
  /** true = engine error/timeout → UI masuk fallback (BK-007), bukan kosong. */
  engineError?: boolean;
  errorMessage?: string;
}

export interface BookingInitRequest {
  /** YYYY-MM-DD */
  checkIn: string;
  /** YYYY-MM-DD */
  checkOut: string;
  adults: number;
  kids: number;
  rooms: number;
  /** room_id dari RateOption terpilih. */
  roomId?: string;
  ratePlanId?: string;
  roomType?: string;
  promoCode?: string;
}

export interface BookingEngineAdapter {
  provider: "cloudbeds" | "mock";
  /**
   * Cek availability + rate. Promise reject → caller map ke engineError
   * (BK-007), jangan sampai crash.
   */
  checkAvailability(req: AvailabilityRequest): Promise<AvailabilityResponse>;
  /** Harga terendah seluruh properti (jendela 30 hari) — untuk "From ...". */
  getFromPrice(): Promise<{ price: number; currency: string } | null>;
  /**
   * Deep link ke Hosted Booking Engine (BK-008).
   * Kembalikan null jika property code belum dikonfigurasi → UI pakai
   * fallback WhatsApp (BK-007).
   */
  buildBookingUrl(req: BookingInitRequest): string | null;
}
