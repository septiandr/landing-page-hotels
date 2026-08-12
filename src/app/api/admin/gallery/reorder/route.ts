import { z } from "zod";
import { db } from "@/lib/db";
import { handleApi, parseZodError, readJson } from "@/lib/handle-api";
import { ApiError } from "@/lib/api-error";
import { requirePermission } from "@/lib/require";
import { revalidateContent } from "@/lib/revalidate";

const reorderSchema = z.object({
  items: z
    .array(z.object({ id: z.string().min(1), sortOrder: z.coerce.number().int().min(0) }))
    .min(1)
    .max(200),
});

/** PATCH /api/admin/gallery/reorder — { items: [{ id, sortOrder }] }. */
export async function PATCH(req: Request) {
  return handleApi(async () => {
    await requirePermission("content");
    const body = await readJson(req);
    const parsed = reorderSchema.safeParse(body);
    if (!parsed.success) throw new ApiError(400, "Validasi gagal", parseZodError(parsed.error));

    await db.$transaction(
      parsed.data.items.map((item) =>
        db.galleryItem.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        }),
      ),
    );

    revalidateContent(["gallery"]);
    return { success: true, updated: parsed.data.items.length };
  });
}
