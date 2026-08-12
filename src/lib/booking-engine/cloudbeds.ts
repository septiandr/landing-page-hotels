import { EngineConfigError, CloudbedsApiError } from "./errors";
import {
  fetchAvailableRoomIds,
  fetchRates,
  buildRateOptions,
} from "./cloudbeds-availability";
import { roomAbbrByCloudbedsId } from "./room-map";
import { buildBookingUrl as buildDeepLink } from "./deep-link";
import type {
  AvailabilityRequest,
  AvailabilityResponse,
  BookingEngineAdapter,
  BookingInitRequest,
} from "./types";

/**
 * CloudbedsAdapter (BK-003/BK-004) — provider utama untuk production.
 *
 * Env wajib (fail-fast saat konstruksi, bukan saat request):
 *   CLOUDBEDS_API_KEY        — API key v1 (X-Api-Key)
 *   CLOUDBEDS_PROPERTY_ID    — ID numerik properti
 *   CLOUDBEDS_API_BASE_URL   — opsional, default https://hotels.cloudbeds.com/api/v1.0
 *   NEXT_PUBLIC_CLOUDBEDS_PROPERTY_CODE — kode 6 karakter engine (deep link)
 */
export class CloudbedsAdapter implements BookingEngineAdapter {
  readonly provider = "cloudbeds" as const;

  private readonly apiKey: string;
  private readonly propertyId: string;
  private readonly baseUrl: string;

  constructor() {
    const apiKey = process.env.CLOUDBEDS_API_KEY;
    const propertyId = process.env.CLOUDBEDS_PROPERTY_ID;
    if (!apiKey) throw new EngineConfigError("CLOUDBEDS_API_KEY belum di-set");
    if (!propertyId) throw new EngineConfigError("CLOUDBEDS_PROPERTY_ID belum di-set");
    this.apiKey = apiKey;
    this.propertyId = propertyId;
    this.baseUrl = process.env.CLOUDBEDS_API_BASE_URL ?? "https://hotels.cloudbeds.com/api/v1.0";
  }

  async checkAvailability(req: AvailabilityRequest): Promise<AvailabilityResponse> {
    try {
      const config = this.config();
      const { roomIds, rooms } = await fetchAvailableRoomIds(config, req);
      if (roomIds.length === 0) return { rates: [] };

      const rates = await fetchRates(config, req, roomIds);
      return { rates: buildRateOptions(roomIds, rooms, rates, req) };
    } catch (err) {
      // Engine down/timeout → jangan crash; UI masuk fallback (BK-007).
      const message =
        err instanceof CloudbedsApiError
          ? `Booking engine tidak tersedia (${err.code})`
          : err instanceof Error
            ? err.message
            : "Booking engine tidak tersedia";
      return { rates: [], engineError: true, errorMessage: message };
    }
  }

  async getFromPrice(): Promise<{ price: number; currency: string } | null> {
    try {
      const config = this.config();
      // Jendela 30 HARI KE DEPAN (bukan masa lalu — availability historis kosong).
      const start = new Date();
      const end = new Date(start.getTime() + 30 * 86_400_000);
      const iso = (d: Date) => localDateInput(d);

      const { roomIds } = await fetchAvailableRoomIds(config, {
        checkIn: iso(start),
        checkOut: iso(end),
        adults: 2,
        kids: 0,
      });
      if (roomIds.length === 0) return null;

      const rates = await fetchRates(
        config,
        { checkIn: iso(start), checkOut: iso(end), adults: 2, kids: 0 },
        roomIds,
      );
      let best: { price: number; currency: string } | null = null;
      for (const roomId of roomIds) {
        const r = rates[roomId];
        if (!r || r.total <= 0) continue;
        const price = Math.round(r.total / 30);
        if (!best || price < best.price) best = { price, currency: r.currency };
      }
      return best;
    } catch {
      return null; // fallback CMS di layer pemanggil (BK-010)
    }
  }

  buildBookingUrl(req: BookingInitRequest): string | null {
    const roomType =
      req.roomType ?? (req.roomId ? roomAbbrByCloudbedsId(req.roomId) : undefined);
    return buildDeepLink({ ...req, roomType });
  }

  private config() {
    return { apiKey: this.apiKey, propertyId: this.propertyId, baseUrl: this.baseUrl };
  }
}

/** YYYY-MM-DD dari Date lokal (hindari toISOString — geser hari di TZ UTC+). */
function localDateInput(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}
