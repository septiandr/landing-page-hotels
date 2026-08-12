import { db } from "@/lib/db";
import { updateHotelSchema } from "@/lib/validators";
import { handleApi, parseZodError, readJson } from "@/lib/handle-api";
import { ApiError } from "@/lib/api-error";
import { requirePermission } from "@/lib/require";
import { audit, diffObjects } from "@/lib/audit";
import { revalidateContent } from "@/lib/revalidate";

export async function GET() {
  return handleApi(async () => {
    await requirePermission("settings");
    const hotel = await db.hotel.findFirst({ include: { seo: true } });
    if (!hotel) throw new ApiError(404, "Data hotel belum ada — jalankan seed");
    return hotel;
  });
}

export async function PATCH(req: Request) {
  return handleApi(async () => {
    const { user } = await requirePermission("settings");
    const hotel = await db.hotel.findFirst();
    if (!hotel) throw new ApiError(404, "Data hotel belum ada — jalankan seed");

    const body = (await readJson(req)) as Record<string, unknown>;
    const parsed = updateHotelSchema.safeParse(body);
    if (!parsed.success) throw new ApiError(400, "Validasi gagal", parseZodError(parsed.error));
    const dataValue = parsed.data as Record<string, unknown>;

    const updated = await db.hotel.update({ where: { id: hotel.id }, data: dataValue });

    const diff = diffObjects(hotel as unknown as Record<string, unknown>, dataValue);
    if (diff) {
      await audit({
        action: "UPDATE",
        entity: "Hotel",
        entityId: hotel.id,
        previous: diff.previous,
        next: diff.next,
        userId: user.id,
      });
    }

    // Hotel dipakai di semua halaman publik → revalidate seluruh layout.
    revalidateContent(["hotel"]);
    return updated;
  });
}
