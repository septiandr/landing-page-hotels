import { db } from "@/lib/db";
import { getNightsBetween } from "@/lib/validators/booking";
import type {
  AvailabilityRequest,
  AvailabilityResponse,
  BookingEngineAdapter,
  BookingInitRequest,
  RateOption,
} from "./types";
import { buildBookingUrl } from "./deep-link";

/**
 * MockAdapter (BK-002) — data deterministik dari `room.priceFrom` DB + delay
 * 600ms. HANYA untuk dev & test E2E tanpa API key Cloudbeds.
 * Dilarang aktif di production (BOOKING_ENGINE_PROVIDER=mock → lihat REL-001).
 */
export class MockAdapter implements BookingEngineAdapter {
  readonly provider = "mock" as const;

  async checkAvailability(req: AvailabilityRequest): Promise<AvailabilityResponse> {
    await new Promise((resolve) => setTimeout(resolve, 600));

    const [hotel, rooms] = await Promise.all([
      db.hotel.findFirst(),
      db.room.findMany({ where: { status: "PUBLISHED" }, orderBy: { sortOrder: "asc" } }),
    ]);
    const currency = hotel?.currency ?? "IDR";
    const nights = getNightsBetween(req.checkIn, req.checkOut);
    const minNights = Math.max(1, nights);

    const rates: RateOption[] = rooms
      .filter((room) => !req.roomSlug || room.slug === req.roomSlug)
      .map((room) => {
        const price = Number(room.priceFrom ?? 0);
        return {
          roomId: room.id,
          roomName: room.name,
          roomSlug: room.slug,
          ratePlanId: null,
          pricePerNight: price,
          currency,
          totalPrice: price * minNights,
          available: price > 0,
          taxIncluded: false,
          cancellationPolicy: "Pembatalan gratis hingga 24 jam sebelum check-in (contoh).",
        };
      });

    return { rates };
  }

  async getFromPrice(): Promise<{ price: number; currency: string } | null> {
    const [hotel, room] = await Promise.all([
      db.hotel.findFirst(),
      db.room.findFirst({ where: { status: "PUBLISHED" }, orderBy: { priceFrom: "asc" } }),
    ]);
    if (!room || room.priceFrom == null) return null;
    return { price: Number(room.priceFrom), currency: hotel?.currency ?? room.currency ?? "IDR" };
  }

  buildBookingUrl(req: BookingInitRequest): string | null {
    return buildBookingUrl(req);
  }
}
