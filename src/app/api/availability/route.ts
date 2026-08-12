import { NextResponse } from "next/server";
import { z } from "zod";
import { bookingRequestSchema } from "@/lib/validators/booking";
import { getEngine } from "@/lib/booking-engine";
import { cached } from "@/lib/booking-engine/cache";
import { parseZodError } from "@/lib/handle-api";
import type { AvailabilityResponse, RateOption } from "@/lib/booking-engine/types";

/**
 * GET /api/availability?checkin=YYYY-MM-DD&checkout=...&adults=2&kids=0&rooms=1&code=&room=
 * (BK-005)
 *
 * - Validasi request (zod) → 400 bila invalid.
 * - Engine availability/rates → 200 { data }.
 * - Engine down/timeout → 503 { error: "ENGINE_UNAVAILABLE" } (bukan 500)
 *   → UI masuk state fallback WhatsApp/Call (BK-007).
 * - Response di-cache 60 detik per kombinasi params (hindari rate limit
 *   Cloudbeds & request identik berulang).
 */

const rateOptionSchema: z.ZodType<RateOption> = z.object({
  roomId: z.string(),
  roomName: z.string(),
  roomSlug: z.string().optional(),
  ratePlanId: z.string().nullable().optional(),
  roomType: z.string().optional(),
  pricePerNight: z.number(),
  currency: z.string(),
  totalPrice: z.number(),
  available: z.boolean(),
  taxIncluded: z.boolean(),
  cancellationPolicy: z.string().optional(),
});

const availabilitySchema: z.ZodType<AvailabilityResponse> = z.object({
  rates: z.array(rateOptionSchema),
  engineError: z.boolean().optional(),
  errorMessage: z.string().optional(),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = bookingRequestSchema.safeParse({
    checkin: url.searchParams.get("checkin") ?? undefined,
    checkout: url.searchParams.get("checkout") ?? undefined,
    adults: url.searchParams.get("adults") ?? undefined,
    kids: url.searchParams.get("kids") ?? undefined,
    rooms: url.searchParams.get("rooms") ?? undefined,
    code: url.searchParams.get("code") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: "Parameter pencarian tidak valid", fields: parseZodError(parsed.error) } },
      { status: 400 },
    );
  }

  const input = parsed.data;
  const cacheKey = `booking:availability:${JSON.stringify({
    i: input.checkin,
    o: input.checkout,
    a: input.adults,
    k: input.kids,
    r: input.rooms,
    c: input.code,
    room: url.searchParams.get("room") ?? undefined,
  })}`;

  const result = await cached(cacheKey, 60_000, async () => {
    const engine = getEngine();
    const res = await engine.checkAvailability({
      checkIn: input.checkin,
      checkOut: input.checkout,
      adults: input.adults,
      kids: input.kids,
      rooms: input.rooms,
      promoCode: input.code,
      roomSlug: url.searchParams.get("room") ?? undefined,
    });

    if (res.engineError) {
      return { engineDown: true as const, message: res.errorMessage };
    }

    // Validasi response sebelum dikirim (DoD BK-005).
    const validated = availabilitySchema.safeParse(res);
    if (!validated.success) {
      return { engineDown: true as const, message: "Response engine tidak valid" };
    }
    return { engineDown: false as const, data: validated.data };
  });

  if (result.engineDown) {
    return NextResponse.json(
      { error: { message: "ENGINE_UNAVAILABLE", detail: result.message ?? null } },
      { status: 503 },
    );
  }

  return NextResponse.json({ data: result.data });
}
