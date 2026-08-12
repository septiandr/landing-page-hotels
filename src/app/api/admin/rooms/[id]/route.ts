import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { updateRoomSchema } from "@/lib/validators";
import { handleApi, parseZodError, readJson } from "@/lib/handle-api";
import { ApiError } from "@/lib/api-error";
import { requirePermission } from "@/lib/require";
import { audit, diffObjects } from "@/lib/audit";
import { revalidateContent } from "@/lib/revalidate";

const ROOM_INCLUDE = {
  photos: { orderBy: { sortOrder: "asc" as const } },
  amenities: true,
} satisfies Prisma.RoomInclude;

type IdCtx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: IdCtx) {
  return handleApi(async () => {
    await requirePermission("content");
    const { id } = await ctx.params;
    const room = await db.room.findUnique({ where: { id }, include: ROOM_INCLUDE });
    if (!room) throw new ApiError(404, "Kamar tidak ditemukan");
    return room;
  });
}

export async function PATCH(req: Request, ctx: IdCtx) {
  return handleApi(async () => {
    const { user } = await requirePermission("content");
    const { id } = await ctx.params;

    const current = await db.room.findUnique({ where: { id }, include: ROOM_INCLUDE });
    if (!current) throw new ApiError(404, "Kamar tidak ditemukan");

    const body = (await readJson(req)) as Record<string, unknown>;
    const parsed = updateRoomSchema.safeParse(body);
    if (!parsed.success) throw new ApiError(400, "Validasi gagal", parseZodError(parsed.error));

    // Slug yang diubah tidak boleh bentrok dengan kamar lain.
    if (parsed.data.slug && parsed.data.slug !== current.slug) {
      const clash = await db.room.findUnique({ where: { slug: parsed.data.slug } });
      if (clash) {
        throw new ApiError(409, "Slug sudah dipakai kamar lain", { slug: ["Slug sudah dipakai"] });
      }
    }

    const { amenities, photos, ...rest } = parsed.data;

    const updated = await db.$transaction(async (tx) => {
      // Relasi dikirim utuh → replace penuh (delete + recreate) biar konsisten.
      if (photos) await tx.roomPhoto.deleteMany({ where: { roomId: id } });
      if (amenities) await tx.roomAmenity.deleteMany({ where: { roomId: id } });

      return tx.room.update({
        where: { id },
        data: {
          ...rest,
          amenities: amenities?.length ? { create: amenities } : undefined,
          photos: photos?.length ? { create: photos } : undefined,
        } as Prisma.RoomUpdateInput,
      });
    });

    const nextForDiff: Record<string, unknown> = { ...rest };
    if (photos) nextForDiff.photos = photos.map((p) => ({ url: p.url }));
    if (amenities) nextForDiff.amenities = amenities.map((a) => ({ name: a.name }));

    const diff = diffObjects(current as unknown as Record<string, unknown>, nextForDiff);
    if (diff) {
      await audit({
        action: "UPDATE",
        entity: "Room",
        entityId: id,
        previous: diff.previous,
        next: diff.next,
        userId: user.id,
      });
    }
    revalidateContent(["rooms"]);
    return updated;
  });
}

export async function DELETE(_req: Request, ctx: IdCtx) {
  return handleApi(async () => {
    const { user } = await requirePermission("content");
    const { id } = await ctx.params;

    const current = await db.room.findUnique({ where: { id } });
    if (!current) throw new ApiError(404, "Kamar tidak ditemukan");

    // Hard-delete — photos & amenities ikut terhapus (cascade, DATA-002).
    await db.room.delete({ where: { id } });
    await audit({
      action: "DELETE",
      entity: "Room",
      entityId: id,
      previous: current,
      userId: user.id,
    });
    revalidateContent(["rooms"]);
    return { success: true };
  });
}
