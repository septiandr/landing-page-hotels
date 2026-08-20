import { db } from "@/lib/db";
import { ApiError } from "@/lib/api-error";
import { handleApi, parseZodError, readJson } from "@/lib/handle-api";
import { requirePermission, requirePermissionWithRead } from "@/lib/require";
import { audit, diffObjects } from "@/lib/audit";
import { bookingStatusPatchSchema } from "@/lib/validators";
import { nextStatus, requiresReason } from "@/lib/booking-status";
import { trackOnsiteBookingCancelled } from "@/lib/analytics";
import type { Booking } from "@/generated/prisma/client";

/**
 * /api/admin/bookings/[id] (OSB-004 / OSB-005)
 * - GET   → detail booking (ADMIN + VIEWER read-only)
 * - PATCH → transisi status: CHECK_IN / CHECK_OUT / CANCEL / NO_SHOW (ADMIN only)
 */

const BOOKING_INCLUDE = {
  roomType: { select: { id: true, name: true, slug: true, currency: true } },
  createdBy: { select: { id: true, name: true, email: true } },
} as const;

type IdCtx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: IdCtx) {
  return handleApi(async () => {
    await requirePermissionWithRead("onsite_booking");
    const { id } = await ctx.params;
    const booking = await db.booking.findUnique({
      where: { id },
      include: BOOKING_INCLUDE,
    });
    if (!booking) throw new ApiError(404, "Booking tidak ditemukan");
    return booking;
  });
}

export async function PATCH(req: Request, ctx: IdCtx) {
  return handleApi(async () => {
    const { user } = await requirePermission("onsite_booking");
    const { id } = await ctx.params;

    const current = await db.booking.findUnique({ where: { id } });
    if (!current) throw new ApiError(404, "Booking tidak ditemukan");

    const body = (await readJson(req)) as Record<string, unknown>;
    const parsed = bookingStatusPatchSchema.safeParse(body);
    if (!parsed.success) throw new ApiError(400, "Validasi gagal", parseZodError(parsed.error));

    const { action, cancellationReason } = parsed.data;

    if (requiresReason(action) && !cancellationReason?.trim()) {
      throw new ApiError(400, "Alasan pembatalan wajib diisi", {
        cancellationReason: ["Alasan pembatalan wajib diisi"],
      });
    }

    const to = nextStatus(current.status, action);
    if (!to) {
      throw new ApiError(409, "INVALID_TRANSITION", {
        form: [`Status ${current.status} tidak bisa diproses aksi ${action}`],
      });
    }

    const updated = await db.booking.update({
      where: { id },
      data: {
        status: to,
        cancellationReason:
          action === "CANCEL" ? cancellationReason?.trim() || null : current.cancellationReason,
      },
      include: BOOKING_INCLUDE,
    });

    const diff = diffObjects(
      { status: current.status } as unknown as Record<string, unknown>,
      { status: updated.status },
    );
    await audit({
      action:
        action === "CHECK_IN"
          ? "CHECK_IN"
          : action === "CHECK_OUT"
            ? "CHECK_OUT"
            : "CANCEL",
      entity: "Booking",
      entityId: id,
      previous: diff?.previous,
      next: diff?.next,
      userId: user.id,
    });

    if (action === "CANCEL") {
      trackOnsiteBookingCancelled({
        bookingCode: updated.code,
        reason: cancellationReason?.trim() ?? null,
      }).catch(() => null);
    }

    return updated as Booking & {
      roomType: { id: string; name: string; slug: string; currency: string };
      createdBy: { id: string; name: string; email: string };
    };
  });
}