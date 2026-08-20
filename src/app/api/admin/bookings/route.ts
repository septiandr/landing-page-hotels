import { db } from "@/lib/db";
import { ApiError } from "@/lib/api-error";
import { handleApi, parseZodError, readJson } from "@/lib/handle-api";
import { requirePermission, requirePermissionWithRead } from "@/lib/require";
import { audit } from "@/lib/audit";
import { getEngine } from "@/lib/booking-engine";
import { cloudbedsRoomIdBySlug } from "@/lib/booking-engine/room-map";
import { generateBookingCode } from "@/lib/booking-code";
import { getNightsBetween, createOnsiteBookingSchema } from "@/lib/validators";
import { trackOnsiteBookingCreated } from "@/lib/analytics";
import type { Booking } from "@/generated/prisma/client";

/**
 * /api/admin/bookings (OSB-003 / OSB-004)
 * - GET  → list & search booking (ADMIN + VIEWER read-only)
 * - POST → create walk-in booking + sync ke Cloudbeds (ADMIN only)
 */

const BOOKING_INCLUDE = {
  roomType: { select: { id: true, name: true, slug: true, currency: true } },
  createdBy: { select: { id: true, name: true, email: true } },
} as const;

type BookingWithRoom = Booking & {
  roomType: { id: string; name: string; slug: string; currency: string };
  createdBy: { id: string; name: string; email: string };
};

export async function GET(req: Request) {
  return handleApi(async () => {
    await requirePermissionWithRead("onsite_booking");
    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit")) || 20));
    const status = url.searchParams.get("status");
    const date = url.searchParams.get("date");
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const q = url.searchParams.get("q")?.trim();

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (date) {
      const d = new Date(`${date}T00:00:00`);
      if (!Number.isNaN(d.getTime())) {
        const end = new Date(d);
        end.setDate(end.getDate() + 1);
        where.checkIn = { gte: d, lt: end };
      }
    } else if (from || to) {
      const range: Record<string, Date> = {};
      if (from) {
        const f = new Date(`${from}T00:00:00`);
        if (!Number.isNaN(f.getTime())) range.gte = f;
      }
      if (to) {
        const t = new Date(`${to}T00:00:00`);
        if (!Number.isNaN(t.getTime())) range.lte = t;
      }
      if (Object.keys(range).length) where.checkIn = range;
    }
    if (q) {
      where.OR = [
        { guestName: { contains: q, mode: "insensitive" } },
        { guestPhone: { contains: q } },
        { code: { contains: q, mode: "insensitive" } },
      ];
    }

    const [total, items] = await Promise.all([
      db.booking.count({ where }),
      db.booking.findMany({
        where,
        include: BOOKING_INCLUDE,
        orderBy: { checkIn: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  });
}

export async function POST(req: Request) {
  return handleApi(async () => {
    const { user } = await requirePermission("onsite_booking");
    const body = (await readJson(req)) as Record<string, unknown>;

    const parsed = createOnsiteBookingSchema.safeParse(body);
    if (!parsed.success) throw new ApiError(400, "Validasi gagal", parseZodError(parsed.error));
    const input = parsed.data;

    const room = await db.room.findUnique({
      where: { id: input.roomTypeId },
      select: { id: true, slug: true, name: true, priceFrom: true, currency: true, status: true },
    });
    if (!room || room.status !== "PUBLISHED") {
      throw new ApiError(400, "Tipe kamar tidak ditemukan", {
        roomTypeId: ["Tipe kamar tidak tersedia"],
      });
    }

    const nights = getNightsBetween(input.checkIn, input.checkOut);
    const totalPrice = Number(input.pricePerNight) * nights;

    // Conflict check: room harus available di SEMUA malam (OSB-003).
    const engine = getEngine();
    const availability = await engine.checkAvailability({
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      adults: input.adults,
      kids: input.kids,
      rooms: 1,
      roomSlug: room.slug,
    });
    if (availability.engineError) {
      throw new ApiError(
        502,
        "ENGINE_UNAVAILABLE",
        { form: ["Booking engine sedang bermasalah. Hubungi tim reservasi."] },
      );
    }
    const available = availability.rates.some((r) => r.roomId === room.id || r.roomSlug === room.slug);
    if (!available) {
      throw new ApiError(409, "ROOM_UNAVAILABLE", {
        form: ["Kamar tidak tersedia di tanggal tersebut."],
      });
    }

    // Sync ke Cloudbeds (OSB-002/003) — gagal → jangan simpan lokal.
    let reservationId: string | null = null;
    if (engine.provider === "cloudbeds") {
      const cloudbedsRoomId = cloudbedsRoomIdBySlug(room.slug) ?? room.slug;
      const reservation = await engine.createReservation({
        checkIn: input.checkIn,
        checkOut: input.checkOut,
        roomId: cloudbedsRoomId,
        adults: input.adults,
        kids: input.kids,
        guest: {
          firstName: input.guestName,
          lastName: "",
          email: input.guestEmail ?? null,
          phone: input.guestPhone,
        },
        total: totalPrice,
      });
      reservationId = reservation.reservationId;
    } else {
      // Mock engine (dev/test) — createReservation tidak perlu, langsung simpan.
      const reservation = await engine.createReservation({
        checkIn: input.checkIn,
        checkOut: input.checkOut,
        roomId: room.slug,
        adults: input.adults,
        kids: input.kids,
        guest: { firstName: input.guestName, lastName: "", email: input.guestEmail, phone: input.guestPhone },
        total: totalPrice,
      });
      reservationId = reservation.reservationId;
    }

    const code = await generateBookingCode();

    const booking = await db.booking.create({
      data: {
        code,
        roomTypeId: room.id,
        checkIn: new Date(`${input.checkIn}T00:00:00`),
        checkOut: new Date(`${input.checkOut}T00:00:00`),
        nights,
        adults: input.adults,
        kids: input.kids,
        guestName: input.guestName.trim(),
        guestPhone: input.guestPhone,
        guestEmail: input.guestEmail ?? null,
        guestIdNumber: input.guestIdNumber ?? null,
        pricePerNight: input.pricePerNight,
        totalPrice,
        currency: room.currency ?? "IDR",
        paymentMethod: input.paymentMethod ?? null,
        notes: input.notes ?? null,
        cloudbedsReservationId: reservationId,
        source: "ONSITE",
        status: "CONFIRMED",
        createdById: user.id,
      },
      include: BOOKING_INCLUDE,
    });

    await audit({
      action: "CREATE",
      entity: "Booking",
      entityId: booking.id,
      next: {
        code: booking.code,
        roomTypeId: room.id,
        checkIn: booking.checkIn.toISOString(),
        checkOut: booking.checkOut.toISOString(),
        nights,
        guestName: booking.guestName,
        totalPrice: Number(booking.totalPrice),
        status: booking.status,
      },
      userId: user.id,
    });

    trackOnsiteBookingCreated({
      bookingCode: booking.code,
      roomName: room.name,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      nights,
      totalPrice: Number(booking.totalPrice),
    }).catch(() => null);

    return booking as BookingWithRoom;
  });
}