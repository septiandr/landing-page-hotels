import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { createRoomSchema } from "@/lib/validators";
import { handleApi, parseZodError, readJson } from "@/lib/handle-api";
import { ApiError } from "@/lib/api-error";
import { requirePermission } from "@/lib/require";
import { audit } from "@/lib/audit";
import { revalidateContent } from "@/lib/revalidate";
import { slugify } from "@/lib/slugify";

const ROOM_INCLUDE = {
  photos: { orderBy: { sortOrder: "asc" as const } },
  amenities: true,
} satisfies Prisma.RoomInclude;

async function uniqueSlug(base: string): Promise<string> {
  let slug = base || "room";
  let n = 2;
  while (await db.room.findUnique({ where: { slug } })) {
    slug = `${base}-${n++}`;
  }
  return slug;
}

export async function GET(req: Request) {
  return handleApi(async () => {
    await requirePermission("content");
    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit")) || 20));
    const q = url.searchParams.get("q")?.trim();
    const status = url.searchParams.get("status")?.trim();

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { slug: { contains: q, mode: "insensitive" } },
      ];
    }

    const [total, items] = await Promise.all([
      db.room.count({ where }),
      db.room.findMany({
        where,
        include: ROOM_INCLUDE,
        orderBy: { sortOrder: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  });
}

export async function POST(req: Request) {
  return handleApi(async () => {
    const { user } = await requirePermission("content");
    const body = (await readJson(req)) as Record<string, unknown>;

    // Slug auto-generate dari nama (CMS-B-003); slug yang dikirim user
    // juga di-unique-kan (hindari Prisma unique error → 500).
    if (!body.slug && typeof body.name === "string" && body.name.trim()) {
      body.slug = await uniqueSlug(slugify(body.name));
    } else if (typeof body.slug === "string" && body.slug.trim()) {
      body.slug = await uniqueSlug(body.slug.trim());
    }

    const parsed = createRoomSchema.safeParse(body);
    if (!parsed.success) throw new ApiError(400, "Validasi gagal", parseZodError(parsed.error));

    const { amenities, photos, ...rest } = parsed.data;

    const room = await db.room.create({
      data: {
        ...rest,
        amenities: amenities?.length ? { create: amenities } : undefined,
        photos: photos?.length ? { create: photos } : undefined,
      } as Prisma.RoomCreateInput,
    });

    await audit({
      action: "CREATE",
      entity: "Room",
      entityId: room.id,
      next: parsed.data,
      userId: user.id,
    });
    revalidateContent(["rooms"]);
    return room;
  });
}
