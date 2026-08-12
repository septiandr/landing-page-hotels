import { db } from "@/lib/db";
import { seoSchema } from "@/lib/validators";
import { handleApi, parseZodError, readJson } from "@/lib/handle-api";
import { ApiError } from "@/lib/api-error";
import { requirePermission } from "@/lib/require";
import { audit } from "@/lib/audit";
import { revalidateContent } from "@/lib/revalidate";

/** Batasan SEO: title ≤ 60, description ≤ 160 (CMS-B-006). */
const seoInputSchema = seoSchema.superRefine((data, ctx) => {
  if (data.metaTitle && data.metaTitle.length > 60) {
    ctx.addIssue({ code: "custom", path: ["metaTitle"], message: "Meta title maksimal 60 karakter" });
  }
  if (data.metaDescription && data.metaDescription.length > 160) {
    ctx.addIssue({
      code: "custom",
      path: ["metaDescription"],
      message: "Meta description maksimal 160 karakter",
    });
  }
});

export async function GET() {
  return handleApi(async () => {
    await requirePermission("settings");
    const hotel = await db.hotel.findFirst({ include: { seo: true } });
    if (!hotel) throw new ApiError(404, "Data hotel belum ada — jalankan seed");
    return hotel.seo;
  });
}

export async function PATCH(req: Request) {
  return handleApi(async () => {
    const { user } = await requirePermission("settings");
    const hotel = await db.hotel.findFirst();
    if (!hotel) throw new ApiError(404, "Data hotel belum ada — jalankan seed");

    const body = (await readJson(req)) as Record<string, unknown>;
    const parsed = seoInputSchema.safeParse(body);
    if (!parsed.success) throw new ApiError(400, "Validasi gagal", parseZodError(parsed.error));

    const seo = await db.seoMeta.upsert({
      where: { hotelId: hotel.id },
      create: { hotelId: hotel.id, ...parsed.data },
      update: parsed.data,
    });

    await audit({
      action: "UPDATE",
      entity: "SeoMeta",
      entityId: seo.id,
      next: parsed.data,
      userId: user.id,
    });
    revalidateContent(["hotel"]);
    return seo;
  });
}
