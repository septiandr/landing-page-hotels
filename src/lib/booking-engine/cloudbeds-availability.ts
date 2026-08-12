import { cloudbedsFetch, type CloudbedsConfig } from "./http";
import { getNightsBetween } from "@/lib/validators/booking";
import { roomAbbrByCloudbedsId, roomSlugByCloudbedsId } from "./room-map";
import type { AvailabilityRequest, RateOption } from "./types";

/**
 * Availability & rates dari Cloudbeds API (BK-004).
 *
 * Bentuk field response API v1 bisa berbeda antar versi — normalisasi di sini
 * satu tempat; verifikasi dengan data live saat BK-014.
 */

interface CloudbedsRoom {
  room_id: string;
  name?: string;
  [key: string]: unknown;
}

interface CloudbedsAvailability {
  /** room_id → { date: jumlah kamar available } */
  [roomId: string]: Record<string, number> | unknown;
}

interface CloudbedsRate {
  room_id?: string;
  roomtype_id?: string;
  [key: string]: unknown;
}

/** Normalisasi getAvailability: room yang tersedia SEMUA malam → list roomId. */
export async function fetchAvailableRoomIds(
  config: CloudbedsConfig,
  req: Pick<AvailabilityRequest, "checkIn" | "checkOut" | "adults" | "kids" | "roomSlug">,
): Promise<{ roomIds: string[]; rooms: CloudbedsRoom[] }> {
  const [availability, roomList] = await Promise.all([
    cloudbedsFetch<CloudbedsAvailability>(config, "getAvailability", {
      start_date: req.checkIn,
      end_date: req.checkOut,
      adults: req.adults,
      children: req.kids,
    }),
    cloudbedsFetch<CloudbedsRoom[]>(config, "getRooms", {}).catch(() => []),
  ]);

  const dates = allDatesBetween(req.checkIn, req.checkOut);

  const available = (availability as Record<string, Record<string, number>>);
  const roomIds = Object.keys(available).filter((roomId) => {
    const perDate = available[roomId];
    if (!perDate) return false;
    // Available di SEMUA malam (bukan sebagian) — nilai > 0 tiap tanggal.
    return dates.every((date) => {
      const count = perDate[date];
      return typeof count === "number" && count > 0;
    });
  });

  return { roomIds, rooms: Array.isArray(roomList) ? roomList : [] };
}

/** Harga per room: getRates → total → pricePerNight. Fallback 0 (rate belum konfig). */
export async function fetchRates(
  config: CloudbedsConfig,
  req: Pick<AvailabilityRequest, "checkIn" | "checkOut" | "adults" | "kids">,
  roomIds: string[],
): Promise<Record<string, { total: number; currency: string }>> {
  const out: Record<string, { total: number; currency: string }> = {};

  const rates = (await cloudbedsFetch<CloudbedsRate[]>(config, "getRates", {
    start_date: req.checkIn,
    end_date: req.checkOut,
    adults: req.adults,
    children: req.kids,
  }).catch(() => [])) as CloudbedsRate[];

  for (const roomId of roomIds) {
    const match = rates.find(
      (r) => r.room_id === roomId || r.roomtype_id === roomId,
    ) as Record<string, unknown> | undefined;
    const rateValue = match?.["rate"] ?? match?.["price"] ?? match?.["total"];
    // Field `rate` di API v1 bisa berupa object { base, weekday, weekend } —
    // ambil nilai numerik yang tersedia (verifikasi shape saat BK-014).
    let total = 0;
    if (typeof rateValue === "number") total = rateValue;
    else if (rateValue && typeof rateValue === "object") {
      const o = rateValue as Record<string, unknown>;
      const base = o["base"] ?? o["weekday"] ?? o["weekend"];
      if (typeof base === "number") total = base;
    }
    out[roomId] = { total, currency: String(match?.["currency"] ?? "USD") };
  }
  return out;
}

/** Bangun RateOption dari hasil normalize — room hanya muncul jika punya harga. */
export function buildRateOptions(
  roomIds: string[],
  rooms: CloudbedsRoom[],
  rates: Record<string, { total: number; currency: string }>,
  req: Pick<AvailabilityRequest, "checkIn" | "checkOut">,
): RateOption[] {
  const nights = Math.max(1, getNightsBetween(req.checkIn, req.checkOut));
  const nameOf = (roomId: string) => {
    const room = rooms.find((r) => r.room_id === roomId);
    return (room?.name as string | undefined) ?? roomId;
  };

  return roomIds.flatMap((roomId) => {
    const { total, currency } = rates[roomId] ?? { total: 0, currency: "USD" };
    if (total <= 0) return []; // tanpa harga → jangan ditampilkan
    return [
      {
        roomId,
        roomName: nameOf(roomId),
        roomSlug: roomSlugByCloudbedsId(roomId),
        roomType: roomAbbrByCloudbedsId(roomId),
        pricePerNight: Math.round(total / nights),
        currency,
        totalPrice: total,
        available: true,
        taxIncluded: false,
      },
    ];
  });
}

/** YYYY-MM-DD dari Date lokal (jangan pakai toISOString — geser hari di TZ UTC+). */
function toDateInput(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function allDatesBetween(start: string, end: string): string[] {
  const dates: string[] = [];
  const cursor = new Date(`${start}T00:00:00`);
  const stop = new Date(`${end}T00:00:00`);
  if (Number.isNaN(cursor.getTime()) || Number.isNaN(stop.getTime())) return [];
  while (cursor < stop) {
    dates.push(toDateInput(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}
