import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { trackBookingCompleted } from "@/lib/analytics";

/**
 * Webhook `reservation/created` dari Cloudbeds (BK-009).
 *
 * Aturan:
 * - Balas 2xx secepatnya (< 2 detik) — Cloudbeds retry 1-menit s/d 5x jika
 *   lambat/gagal; JANGAN proses berat sinkron.
 * - Idempotent: `BookingEvent.reservationId` unique — event duplikat tidak
 *   men-trigger `booking_completed` dua kali.
 * - Validasi propertyID == CLOUDBEDS_PROPERTY_ID.
 * - Webhook v1 tidak punya signature — jangan expose data sensitif.
 */

interface CloudbedsWebhookPayload {
  version?: string;
  timestamp?: string;
  event?: string;
  propertyID?: string | number;
  reservationID?: string | number;
  startDate?: string;
  endDate?: string;
  [key: string]: unknown;
}

/** Rate limit kasar per IP (endpoint publik tanpa signature) — cegah spam DB. */
const burst = new Map<string, number[]>();
function allowRequest(key: string, limit = 30, windowMs = 60_000): boolean {
  const now = Date.now();
  const hits = (burst.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    burst.set(key, hits);
    return false;
  }
  hits.push(now);
  burst.set(key, hits);
  return true;
}

export async function POST(req: Request) {
  const propertyId = process.env.CLOUDBEDS_PROPERTY_ID;

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!allowRequest(`webhook:${ip}`)) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  let payload: CloudbedsWebhookPayload | null = null;
  try {
    payload = (await req.json()) as CloudbedsWebhookPayload;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // Validasi property — tolak event dari properti lain.
  const incoming = String(payload.propertyID ?? "");
  if (propertyId && incoming && incoming !== propertyId) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const reservationId = String(payload.reservationID ?? "");
  if (!reservationId || (payload.event && payload.event !== "reservation/created")) {
    // Bukan event yang kita proses — balas 200 supaya Cloudbeds tidak retry.
    return NextResponse.json({ ok: true, ignored: true });
  }

  // Idempotent: reservationID unique di tabel BookingEvent.
  const exists = await db.bookingEvent.findUnique({
    where: { reservationId },
    select: { id: true },
  });
  if (exists) {
    return NextResponse.json({ ok: true, duplicate: true });
  }

  await db.bookingEvent.create({
    data: {
      reservationId,
      propertyId: incoming || propertyId || "",
      event: payload.event ?? "reservation/created",
      payload: payload as object,
    },
  });

  // Tracking tidak boleh memperlambat balasan — fire & forget.
  void trackBookingCompleted({
    reservationId,
    propertyId: incoming || propertyId || "",
    startDate: payload.startDate,
    endDate: payload.endDate,
  });

  return NextResponse.json({ ok: true });
}
